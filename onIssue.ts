import { HttpStatusCode, IHttp, IModify, IPersistence, IRead, IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors';
import { IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ApiEndpoint } from '@rocket.chat/apps-engine/definition/api/ApiEndpoint';
import { IApiEndpointInfo } from '@rocket.chat/apps-engine/definition/api/IApiEndpointInfo';
import { startNewMessageWithDefaultSenderConfig, parseJiraDomainFromIssueUrl } from './helpers';

export class OnIssueEndpoint extends ApiEndpoint {
    public path: string = 'on_issue';

    // tslint:disable-next-line:max-line-length
    public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse> {
        const sender = await read.getUserReader().getById('rocket.cat');
        const room = await read.getRoomReader().getById('GENERAL');

        if (!sender || !room) {
            return {
                status: HttpStatusCode.OK,
            };
        }

        const {issue_event_type_name, issue, user, changelog} = request.content;

        const messageBuilder = startNewMessageWithDefaultSenderConfig(modify, sender);

        if (issue_event_type_name === 'issue_created') {
            this.processIssueCreatedEvent(request, messageBuilder, modify, read);
        } else if (issue_event_type_name === 'issue_updated') {
            changelog.items.forEach((item) => {
                if (item.field !== 'assignee') {
                    return;
                }

                const msg = modify.getCreator().startMessage()
                    .setSender(sender)
                    .setUsernameAlias('Jira')
                    .setAvatarUrl('https://slack-files2.s3-us-west-2.amazonaws.com/avatars/2017-09-11/239622728805_193a5464df40bdbdb528_512.png')
                    .setRoom(room);

                const from = user.displayName;
                const to = item.toString || 'Unassigned';

                msg.setText(`*${from}* assigned a \`${issue.fields.issuetype.name}\` in \`${issue.fields.status.name}\` to *${to}*`);

                msg.addAttachment({
                    title: {
                        value: `${issue.key}: ${issue.fields.summary}`,
                        link: `https://rocketchat-dev.atlassian.net/browse/${issue.key}`,
                    },
                });

                modify.getCreator().finish(msg);
            });
        }

        return {
            status: HttpStatusCode.OK,
        };
    }

    private async processIssueCreatedEvent(request: IApiRequest, messageBuilder: IMessageBuilder, modify: IModify, read: IRead): Promise<void> {
        const { issue, user, changelog } = request.content;
        const { displayName: from } = user;
        const issueType = issue.fields.issuetype.name;
        const status = issue.fields.status.name;
        const assignee = issue.fields.assignee ? issue.fields.assignee.name : 'Unassigned';
        const attachment = {
            title: {
                value: `${issue.key}: ${issue.fields.summary}`,
                link: `${parseJiraDomainFromIssueUrl(issue.self)}/browse/${issue.key}`
            }
        }

        // We may have to send the message to multiple rooms in the future
        const room = await read.getRoomReader().getById('GENERAL');

        if (!room) {
            this.app.getLogger().error('Invalid room provided');
            return;
        }

        messageBuilder.setRoom(room);
        messageBuilder.setText(`*${from}* created a \`${issueType}\` in \`${status}\` assigned to *${assignee}*`)
        messageBuilder.addAttachment(attachment);

        modify.getCreator().finish(messageBuilder);
    }
}

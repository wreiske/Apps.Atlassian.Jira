import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ApiEndpoint } from '@rocket.chat/apps-engine/definition/api/ApiEndpoint';
import { IApiEndpointInfo } from '@rocket.chat/apps-engine/definition/api/IApiEndpointInfo';

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

        if (issue_event_type_name === 'issue_updated' || issue_event_type_name === 'issue_assigned') {
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
}

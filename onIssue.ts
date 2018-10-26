import { HttpStatusCode, IHttp, IMessageBuilder, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ApiEndpoint } from '@rocket.chat/apps-engine/definition/api/ApiEndpoint';
import { IApiEndpointInfo } from '@rocket.chat/apps-engine/definition/api/IApiEndpointInfo';
import { parseJiraDomainFromIssueUrl, startNewMessageWithDefaultSenderConfig } from './helpers';

enum IssueEvent {
    Created = 'issue_created',
    Updated = 'issue_updated',
    Generic = 'issue_generic',
    Assigned = 'issue_assigned',
}

export class OnIssueEndpoint extends ApiEndpoint {
    public path: string = 'on_issue';

    // tslint:disable-next-line:max-line-length
    public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse> {
        const sender = await read.getUserReader().getById('rocket.cat');
        const room = await read.getRoomReader().getById('GENERAL');

        if (!sender || !room) {

            if (!sender) {
                this.app.getLogger().error('No `sender` configured for the app');
            }

            if (!room) {
                this.app.getLogger().error('No `room` configured for the app');
            }

            return {
                status: HttpStatusCode.OK,
            };
        }

        const messageBuilder = startNewMessageWithDefaultSenderConfig(modify, sender, room);
        let sendMessage = true;

        switch (request.content.issue_event_type_name) {
            case IssueEvent.Created:
                this.processIssueCreatedEvent(request, messageBuilder);
                break;

            case IssueEvent.Updated:
            case IssueEvent.Assigned:
                sendMessage = this.processIssueUpdatedEvent(request, messageBuilder);
                break;

            case IssueEvent.Generic:
                sendMessage = this.processIssueGenericEvent(request, messageBuilder);
                break;

            default:
                this.app.getLogger().error('Unknown event received');
                sendMessage = false;
                break;
        }

        if (sendMessage !== false) {
            modify.getCreator().finish(messageBuilder);
        }

        return {
            status: HttpStatusCode.OK,
        };
    }

    private processIssueCreatedEvent(request: IApiRequest, messageBuilder: IMessageBuilder): void {
        const { issue, user } = request.content;
        const { displayName: from } = user;
        const issueType = issue.fields.issuetype.name;
        const status = issue.fields.status.name;
        const assignee = issue.fields.assignee ? issue.fields.assignee.name : 'Unassigned';
        const attachment = {
            title: {
                value: `${issue.key}: ${issue.fields.summary}`,
                link: `${parseJiraDomainFromIssueUrl(issue.self)}/browse/${issue.key}`,
            },
        };

        messageBuilder.setText(`*${from}* created a \`${issueType}\` in \`${status}\` assigned to *${assignee}*`);
        messageBuilder.addAttachment(attachment);
    }

    private processIssueGenericEvent(request: IApiRequest, messageBuilder: IMessageBuilder): boolean {
        const { issue, user, changelog } = request.content;
        const { displayName: from } = user;
        const issueType = issue.fields.issuetype.name;
        const attachment = {
            title: {
                value: `${issue.key}: ${issue.fields.summary}`,
                link: `${parseJiraDomainFromIssueUrl(issue.self)}/browse/${issue.key}`,
            },
        };
        let statusFrom;
        let statusTo;

        changelog.items.forEach((item) => {
            if (item.field !== 'status') {
                return;
            }

            statusFrom = item.fromString;
            statusTo = item.toString;
        });

        // We only notify on status change, not other updates;
        if (statusFrom === undefined || statusTo === undefined) {
            return false;
        }

        messageBuilder.setText(`*${from}* transitioned a \`${issueType}\` from \`${statusFrom}\` to \`${statusTo}\``);
        messageBuilder.addAttachment(attachment);

        return true;
    }

    private processIssueUpdatedEvent(request: IApiRequest, messageBuilder: IMessageBuilder): boolean {
        const { issue, user, changelog } = request.content;
        const { displayName: from } = user;
        const issueType = issue.fields.issuetype.name;
        const status = issue.fields.status.name;
        const attachment = {
            title: {
                value: `${issue.key}: ${issue.fields.summary}`,
                link: `${parseJiraDomainFromIssueUrl(issue.self)}/browse/${issue.key}`,
            },
        };
        let assignee;

        changelog.items.forEach((item) => {
            if (item.field !== 'assignee') {
                return;
            }

            assignee = item.toString || 'Unassigned';
        });

        // We only notify on assignment change, not other updates
        if (assignee === undefined) {
            return false;
        }

        messageBuilder.setText(`*${from}* assigned a \`${issueType}\` in \`${status}\` to *${assignee}*`);
        messageBuilder.addAttachment(attachment);

        return true;
    }
}

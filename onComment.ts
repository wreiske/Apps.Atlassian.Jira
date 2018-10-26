import {
    HttpStatusCode,
    IHttp,
    IMessageBuilder,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ApiEndpoint } from '@rocket.chat/apps-engine/definition/api/ApiEndpoint';
import { IApiEndpointInfo } from '@rocket.chat/apps-engine/definition/api/IApiEndpointInfo';

import { parseJiraDomainFromIssueUrl, startNewMessageWithDefaultSenderConfig } from './helpers';

const WEBHOOK_EVENT_COMMENT_CREATED = 'comment_created';
const WEBHOOK_EVENT_COMMENT_UPDATED = 'comment_updated';

export class OnCommentEndpoint extends ApiEndpoint {
    public path: string = 'on_comment';

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

        switch (request.content.webhookEvent) {
            case WEBHOOK_EVENT_COMMENT_CREATED:
                this.processCommentCreatedEvent(request, messageBuilder);
                break;

            case WEBHOOK_EVENT_COMMENT_UPDATED:
                this.processCommentUpdatedEvent(request, messageBuilder);
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

    private processCommentCreatedEvent(request: IApiRequest, messageBuilder: IMessageBuilder): void {
        const { issue, comment } = request.content;
        const { updateAuthor: { displayName: from }, body: description } = comment;
        const issueType = issue.fields.issuetype.name;
        const status = issue.fields.status.name;
        const attachment = {
            title: {
                value: `${issue.key}: ${issue.fields.summary}`,
                link:
                    `${parseJiraDomainFromIssueUrl(issue.self)}/browse/${
                        issue.key
                    }?focusedCommentId=${comment.id}&#comment-${comment.id}`,
            },
            description,
        };

        messageBuilder.setText(`*${from}* commented on a \`${issueType}\` in \`${status}\``);
        messageBuilder.addAttachment(attachment);
    }

    private processCommentUpdatedEvent(request: IApiRequest, messageBuilder: IMessageBuilder): void {
        const { issue, comment } = request.content;
        const { updateAuthor: { displayName: from }, body: description } = comment;
        const issueType = issue.fields.issuetype.name;
        const status = issue.fields.status.name;
        const attachment = {
            title: {
                value: `${issue.key}: ${issue.fields.summary}`,
                link:
                    `${parseJiraDomainFromIssueUrl(issue.self)}/browse/${
                        issue.key
                    }?focusedCommentId=${comment.id}&#comment-${comment.id}`,
            },
            description,
        };

        messageBuilder.setText(`*${from}* edited a comment on a \`${issueType}\` in \`${status}\``);
        messageBuilder.addAttachment(attachment);
    }
}

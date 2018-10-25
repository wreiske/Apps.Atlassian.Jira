import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ApiEndpoint } from '@rocket.chat/apps-engine/definition/api/ApiEndpoint';
import { IApiEndpointInfo } from '@rocket.chat/apps-engine/definition/api/IApiEndpointInfo';

import { startNewMessageWithDefaultSenderConfig } from './helpers';

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
        const sendMessage = true;

        return {
            status: HttpStatusCode.OK,
        };
    }
}

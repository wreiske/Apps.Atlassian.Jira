import { HttpStatusCode, IHttp, IModify, IPersistence, IRead, IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

export function startNewMessageWithDefaultSenderConfig(modify: IModify, sender: IUser, room: IRoom): IMessageBuilder {
    return modify.getCreator().startMessage()
        .setSender(sender)
        .setRoom(room)
        // @TODO maybe an app setting?
        .setUsernameAlias('Jira')
        // @TODO maybe an app setting?
        .setAvatarUrl('https://slack-files2.s3-us-west-2.amazonaws.com/avatars/2017-09-11/239622728805_193a5464df40bdbdb528_512.png')
}

export function parseJiraDomainFromIssueUrl(issueUrl: string): string {
    const [domain] = (issueUrl.match(/^https?:\/\/[^\/]+/) as Array<any>);

    return domain;
}

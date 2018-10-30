import { IMessageBuilder, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { AppSetting } from './app-settings';

export async function startNewMessageWithDefaultSenderConfig(modify: IModify, read: IRead, sender: IUser, room: IRoom): Promise<IMessageBuilder> {
    const settingsReader = read.getEnvironmentReader().getSettings();
    const userAliasSetting = await settingsReader.getValueById(AppSetting.UserAlias);
    const userAvatarSetting = await settingsReader.getValueById(AppSetting.UserAvatar);

    return modify.getCreator().startMessage()
        .setSender(sender)
        .setRoom(room)
        .setUsernameAlias(userAliasSetting)
        .setAvatarUrl(userAvatarSetting);
}

export function parseJiraDomainFromIssueUrl(issueUrl: string): string {
    const [domain] = (issueUrl.match(/^https?:\/\/[^\/]+/) as Array<any>);

    return domain;
}

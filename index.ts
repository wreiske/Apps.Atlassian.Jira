import {
    IConfigurationExtend,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
// import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

// import { JitsiSlashCommand } from './slashcommand';
// import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api/IApi';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api/IApi';
import { AuthEndpoint, InstallEndpoint, ManifestEndpoint, SampleEndpoint } from './endpoints';
import { OnIssueEndpoint } from './onIssue';

export class JiraApp extends App {
    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        // await configuration.slashCommands.provideSlashCommand(new JitsiSlashCommand(this));
        await configuration.api.provideApi({
            visibility: ApiVisibility.PRIVATE,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new ManifestEndpoint(this),
                new InstallEndpoint(this),
                new AuthEndpoint(this),
                new OnIssueEndpoint(this),
                new SampleEndpoint(this),
            ],
        });

        // await configuration.settings.provideSetting({
        //     id: 'server',
        //     type: SettingType.STRING,
        //     packageValue: 'https://meet.jit.si/',
        //     required: true,
        //     public: false,
        //     i18nLabel: 'server',
        //     i18nDescription: 'server_description',
        // });
    }
}

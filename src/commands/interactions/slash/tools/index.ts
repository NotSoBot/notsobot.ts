import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ToolsHashCommand } from './hash';
import { ToolsMathCommand } from './math';
import { ToolsScreenshotCommand } from './screenshot';
import { ToolsTranscribeCommand } from './transcribe';
import { ToolsTranslateCommand } from './translate';
import { ToolsWeatherCommand } from './weather';

import { ToolsMLGroupCommand } from './ml';
import { ToolsQrGroupCommand } from './qr';


export default class ToolsGroupCommand extends BaseSlashCommand {
  description = 'Tool-like Commands';
  name = 'tools';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new ToolsHashCommand(),
        new ToolsMathCommand(),
        new ToolsMLGroupCommand(),
        new ToolsQrGroupCommand(),
        new ToolsScreenshotCommand(),
        new ToolsTranscribeCommand(),
        new ToolsTranslateCommand(),
        new ToolsWeatherCommand(),
      ],
    });
  }
}

import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ToolsCodeCommand } from './code';
import { ToolsExifCommand } from './exif';
import { ToolsHashCommand } from './hash';
import { ToolsLabelsCommand } from './labels';
import { ToolsMathCommand } from './math';
import { ToolsOCRTranslateCommand } from './ocr-translate';
import { ToolsSafetyLabelsCommand } from './safety-labels';
import { ToolsScreenshotCommand } from './screenshot';
import { ToolsTranscribeCommand } from './transcribe';
import { ToolsTranscribeTranslateCommand } from './transcribe-translate';
import { ToolsTranslateCommand } from './translate';
import { ToolsWeatherCommand } from './weather';

import { ToolsMLGroupCommand } from './ml';
import { ToolsQrGroupCommand } from './qr';


export default class ToolsGroupCommand extends BaseSlashCommand {
  description = 'Tool-like Commands';
  descriptionLocalizations = I18n.localizations('commands.tools.description');
  name = 'tools';
  nameLocalizations = I18n.localizations('commands.tools.name');

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
        new ToolsCodeCommand(),
        new ToolsExifCommand(),
        new ToolsHashCommand(),
        new ToolsLabelsCommand(),
        new ToolsMLGroupCommand(),
        new ToolsMathCommand(),
        new ToolsOCRTranslateCommand(),
        new ToolsQrGroupCommand(),
        new ToolsSafetyLabelsCommand(),
        new ToolsScreenshotCommand(),
        new ToolsTranscribeCommand(),
        new ToolsTranscribeTranslateCommand(),
        new ToolsTranslateCommand(),
        new ToolsWeatherCommand(),
      ],
    });
  }
}

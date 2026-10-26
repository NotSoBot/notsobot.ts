import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ToolsCodeCommand } from './code';
import { ToolsColorCommand } from './color';
import { ToolsExifCommand } from './exif';
import { ToolsHashCommand } from './hash';
import { ToolsLabelsCommand } from './labels';
import { ToolsMathCommand } from './math';
import { ToolsOCRTranslateCommand } from './ocr-translate';
import { ToolsSafetyLabelsCommand } from './safety-labels';
import { ToolsScreenshotCommand } from './screenshot';
import { ToolsToneCommand } from './tone';
import { ToolsTranscribeCommand } from './transcribe';
import { ToolsTranscribeTranslateCommand } from './transcribe-translate';
import { ToolsTranslateCommand } from './translate';
import { ToolsUnicodeCommand } from './unicode';
import { ToolsWeatherCommand } from './weather';

import { ToolsMLGroupCommand } from './ml';
import { ToolsQrGroupCommand } from './qr';


export default class ToolsGroupCommand extends BaseSlashCommand {
  description = 'Translate, OCR, math, QR codes, weather and more';
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
        new ToolsColorCommand(),
        new ToolsExifCommand(),
        new ToolsHashCommand(),
        new ToolsLabelsCommand(),
        new ToolsMLGroupCommand(),
        new ToolsMathCommand(),
        new ToolsOCRTranslateCommand(),
        new ToolsQrGroupCommand(),
        new ToolsSafetyLabelsCommand(),
        new ToolsScreenshotCommand(),
        new ToolsToneCommand(),
        new ToolsTranscribeCommand(),
        new ToolsTranscribeTranslateCommand(),
        new ToolsTranslateCommand(),
        new ToolsUnicodeCommand(),
        new ToolsWeatherCommand(),
      ],
    });
  }
}

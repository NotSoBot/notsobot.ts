import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAIVAudioPutConcatCommand } from './audio-concat';
import { MediaAIVAudioPutMixCommand } from './audio-mix';
import { MediaAIVToolsAudioNoiseCommand } from './audio-noise';
import { MediaAIVAudioPutReplaceCommand } from './audio-replace';
import { MediaAIVConvertCommand } from './convert';
import { MediaAIVToolsFFMPEGCommand } from './ffmpeg';


export default class MediaAIVToolsGroupCommand extends BaseSlashCommand {
  description = 'Convert any media or change its audio';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.description');
  name = 'media-aiv-tools';

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
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new MediaAIVAudioPutConcatCommand(),
        new MediaAIVAudioPutMixCommand(),
        new MediaAIVToolsAudioNoiseCommand(),
        new MediaAIVAudioPutReplaceCommand(),
        new MediaAIVConvertCommand(),
        new MediaAIVToolsFFMPEGCommand(),
      ],
    });
  }
}

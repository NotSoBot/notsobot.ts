import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAVExtractGroupCommand } from './extract';
import { MediaAVToolsSetGroupCommand } from './set';

import { MediaAVAudioChannelsCombineCommand } from './channels-combine';
import { MediaAVAudioChannelsInvertCommand } from './channels-invert';
import { MediaAVAudioDelayCommand } from './delay';
import { MediaAVToolsIdentifyCommand } from './identify';
import { MediaAVAudioVolumeCommand } from './volume';
import { MediaAVWaveformCommand } from './waveform';


export default class MediaAVToolsGroupCommand extends BaseSlashCommand {
  description = 'Volume, channels, waveform, identify a song and other audio tools';
  descriptionLocalizations = I18n.localizations('commands.media_av_tools.description');
  name = 'media-av-tools';

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
        new MediaAVExtractGroupCommand(),
        new MediaAVToolsSetGroupCommand(),
        new MediaAVAudioChannelsCombineCommand(),
        new MediaAVAudioChannelsInvertCommand(),
        new MediaAVAudioDelayCommand(),
        new MediaAVToolsIdentifyCommand(),
        new MediaAVAudioVolumeCommand(),
        new MediaAVWaveformCommand(),
      ],
    });
  }
}

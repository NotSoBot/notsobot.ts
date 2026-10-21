import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAVAudioMultiPitchCommand } from './multipitch';
import { MediaAVAudioPitchCommand } from './pitch';
import { MediaAVAudioVocoderChordCommand } from './vocoder-chord';
import { MediaAVAudioVocoderCommand } from './vocoder';


export default class MediaAVPitchGroupCommand extends BaseSlashCommand {
  description = 'Pitch shift audio or make a voice sing with the vocoder';
  descriptionLocalizations = I18n.localizations('commands.media_av_pitch.description');
  name = 'media-av-pitch';

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
        new MediaAVAudioMultiPitchCommand(),
        new MediaAVAudioPitchCommand(),
        new MediaAVAudioVocoderChordCommand(),
        new MediaAVAudioVocoderCommand(),
      ],
    });
  }
}

import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'compress';

export class MediaAVAudioCompressCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Crush an Audio or Video\'s audio down to 8 kHz, low bitrate sound';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.compress.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioCompress.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.compress.name');

  constructor() {
    super({
      options: [
        {name: 'norevert', description: 'Keep the 8 kHz Sample Rate Instead of Converting Back (Default: False)', ...I18n.optionLocalizations('commands.media_av.audio.compress.norevert'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioCompress.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioCompress.createMessage(context, args);
  }
}

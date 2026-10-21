import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'tremolo';

export class MediaAVAudioTremoloCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Modify the audio\'s wave pattern in an Audio or Video file';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.tremolo.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioTremolo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.tremolo.name');

  constructor() {
    super({
      options: [
        {name: 'frequency', description: 'Modulation Frequency (Default: 5.0)', ...I18n.optionLocalizations('commands.media_av.audio.tremolo.frequency'), type: 'number'},
        {name: 'depth', description: 'Depth of Modulation (Default: 0.5)', ...I18n.optionLocalizations('commands.media_av.audio.tremolo.depth'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioTremolo.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioTremolo.createMessage(context, args);
  }
}

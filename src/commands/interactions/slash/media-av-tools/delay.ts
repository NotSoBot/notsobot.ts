import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'delay';

export class MediaAVAudioDelayCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Delay the Audio Stream of an Audio or Video File';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.delay.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioDelay.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Delay Amount', ...I18n.optionLocalizations('commands.media_av.audio.delay.delay'), required: true, type: 'number'},
        {name: 'nosnip', description: 'Avoid Snipping Excess Audio', ...I18n.optionLocalizations('commands.media_av.audio.delay.nosnip'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioDelay.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioDelay.createMessage(context, args);
  }
}

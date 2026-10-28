import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'waveform';

export class MediaAVWaveformCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Draw the audio of an Audio or Video file as a waveform image';
  descriptionLocalizations = I18n.localizations('commands.media_av.waveform.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationWaveform.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.waveform.name');

  constructor() {
    super({
      options: [
        {name: 'color', description: 'Waveform Color', ...I18n.optionLocalizations('commands.media_av.waveform.color')},
        {name: 'split', description: 'Draw Each Audio Channel Separately', ...I18n.optionLocalizations('commands.media_av.waveform.split'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationWaveform.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationWaveform.createMessage(context, args);
  }
}

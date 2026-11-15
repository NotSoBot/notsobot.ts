import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'vibrato';

export class MediaAVAudioVibratoCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Make an Audio or Video\'s pitch waver up and down (vibrato)';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.vibrato.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioVibrato.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'frequency', description: 'Modulation Frequency (Default: 5.0)', ...I18n.optionLocalizations('commands.media_av.audio.vibrato.frequency'), type: 'number'},
        {name: 'depth', description: 'Depth of Modulation (Default: 0.5)', ...I18n.optionLocalizations('commands.media_av.audio.vibrato.depth'), type: 'number'},
        {name: 'semitones', description: 'Draw the pitch from a curve: semitones at depth 1 (-24 to 24, default 12)', ...I18n.optionLocalizations('commands.media_av.audio.vibrato.semitones'), type: 'number'},
        {name: 'points', description: 'Curve points: phase,depth pairs split by spaces (default 0,0 0.25,1 0.75,-1 1,0)', ...I18n.optionLocalizations('commands.media_av.audio.vibrato.points')},
        {name: 'blend', description: 'Fade over the skip back at the start of each curve cycle', ...I18n.optionLocalizations('commands.media_av.audio.vibrato.blend'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioVibrato.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVibrato.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'equalizer';

export class MediaAVAudioEqualizerCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Manipulate an Audio or Video\'s Equalizer Settings';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.equalizer.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioEqualizer.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.equalizer.name');

  constructor() {
    super({
      options: [
        {name: 'subbass', label: 'subBass', description: 'Sub-bass EQ adjustment in dB (50Hz, Range: -50 to 50)', ...I18n.optionLocalizations('commands.media_av.audio.equalizer.subbass'), type: 'number'},
        {name: 'bass', description: 'Bass EQ adjustment in dB (100Hz, Range: -50 to 50)', ...I18n.optionLocalizations('commands.media_av.audio.equalizer.bass'), type: 'number'},
        {name: 'lowmids', label: 'lowMids', description: 'Low-Mids EQ adjustment in dB (300Hz, Range: -50 to 50)', ...I18n.optionLocalizations('commands.media_av.audio.equalizer.lowmids'), type: 'number'},
        {name: 'mids', description: 'Mids EQ adjustment in dB (1000Hz, Range: -50 to 50)', ...I18n.optionLocalizations('commands.media_av.audio.equalizer.mids'), type: 'number'},
        {name: 'highmids', label: 'highMids', description: 'High-Mids EQ adjustment in dB (3000Hz, Range: -50 to 50)', ...I18n.optionLocalizations('commands.media_av.audio.equalizer.highmids'), type: 'number'},
        {name: 'treble', description: 'Treble EQ adjustment in dB (8000Hz, Range: -50 to 50)', ...I18n.optionLocalizations('commands.media_av.audio.equalizer.treble'), type: 'number'},
        {name: 'air', description: 'Air EQ adjustment in dB (15000Hz, Range: -50 to 50)', ...I18n.optionLocalizations('commands.media_av.audio.equalizer.air'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioEqualizer.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioEqualizer.createMessage(context, args);
  }
}

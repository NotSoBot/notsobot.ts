import { Interaction } from 'detritus-client';

import { MediaAudioBitcrushModes, MediaAudioBitcrushModesToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


const DEFAULT_MODE = Formatter.Commands.MediaAVManipulationAudioBitcrush.DEFAULT_MODE;

export const COMMAND_NAME = 'bitcrush';

export class MediaAVAudioBitcrushCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Bit Crush an Audio or Video\'s audio, lowering its sample rate and bit depth';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.bitcrush.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioBitcrush.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.bitcrush.name');

  constructor() {
    super({
      options: [
        {name: 'samples', description: 'Sample rate reduction factor, 1 to 250 (Default: 6)', ...I18n.optionLocalizations('commands.media_av.audio.bitcrush.samples'), type: Number},
        {name: 'bits', description: 'Bit depth, 1 to 64 (Default: 8)', ...I18n.optionLocalizations('commands.media_av.audio.bitcrush.bits'), type: Number},
        {name: 'mix', description: 'How much of the crushed audio to use, 0 to 1 (Default: 1)', ...I18n.optionLocalizations('commands.media_av.audio.bitcrush.mix'), type: 'number'},
        {
          name: 'mode',
          description: `Bit Reduction Mode (Default: ${DEFAULT_MODE})`,
          ...I18n.optionLocalizations('commands.media_av.audio.bitcrush.mode'),
          choices: Parameters.Slash.oneOf({
            choices: MediaAudioBitcrushModes,
            descriptions: MediaAudioBitcrushModesToText,
            defaultChoice: DEFAULT_MODE,
            localizationKey: 'choices.media_audio_bitcrush_modes',
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioBitcrush.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioBitcrush.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';

import {
  MediaImageToAudioModes,
  MediaImageToAudioModesToText,
  MediaImageToAudioScales,
  MediaImageToAudioScalesToText,
} from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'image-to-audio';

export class ToolsImageToAudioCommand extends BaseInteractionImageCommandOption {
  description = 'Turn an Image into sound, drawn into its spectrogram or played as raw bytes';
  descriptionLocalizations = I18n.localizations('commands.tools.image_to_audio.description');
  metadata = {
    id: Formatter.Commands.MediaIVToolsImageToAudio.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.image_to_audio.name');

  constructor() {
    super({
      options: [
        {
          name: 'mode',
          description: `How it becomes sound (Default: ${MediaImageToAudioModesToText[MediaImageToAudioModes.SPECTROGRAM]})`,
          ...I18n.optionLocalizations('commands.tools.image_to_audio.mode'),
          choices: Parameters.Slash.oneOf({
            choices: MediaImageToAudioModes,
            descriptions: MediaImageToAudioModesToText,
            defaultChoice: MediaImageToAudioModes.SPECTROGRAM,
            localizationKey: 'choices.media_image_to_audio_modes',
          }),
        },
        {name: 'duration', description: 'Seconds, 0.5 to 30 (Default: 5, an animation its own length)', ...I18n.optionLocalizations('commands.tools.image_to_audio.duration'), type: 'number'},
        {name: 'low', description: 'Frequency at the bottom of the image, 20 to 20000 hz (Default: 100)', ...I18n.optionLocalizations('commands.tools.image_to_audio.low'), type: 'number'},
        {name: 'high', description: 'Frequency at the top of the image, 20 to 20000 hz (Default: 12000)', ...I18n.optionLocalizations('commands.tools.image_to_audio.high'), type: 'number'},
        {
          name: 'scale',
          description: `How the rows are spread over the frequencies (Default: ${MediaImageToAudioScalesToText[MediaImageToAudioScales.LINEAR]})`,
          ...I18n.optionLocalizations('commands.tools.image_to_audio.scale'),
          choices: Parameters.Slash.oneOf({
            choices: MediaImageToAudioScales,
            descriptions: MediaImageToAudioScalesToText,
            defaultChoice: MediaImageToAudioScales.LINEAR,
            localizationKey: 'choices.media_image_to_audio_scales',
          }),
        },
        {name: 'invert', description: 'Dark pixels are loud instead of bright ones (Default: False)', ...I18n.optionLocalizations('commands.tools.image_to_audio.invert'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsImageToAudio.CommandArgs) {
    return Formatter.Commands.MediaIVToolsImageToAudio.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';

import {
  MediaAudioToImageModes,
  MediaAudioToImageModesToText,
  MediaImageToAudioScales,
  MediaImageToAudioScalesToText,
} from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'audio-to-image';

export class MediaAVToolsAudioToImageCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Turn an Audio or Video file into an image of its spectrogram, raw bytes or SSTV picture';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio_to_image.description');
  metadata = {
    id: Formatter.Commands.MediaAVToolsAudioToImage.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio_to_image.name');

  constructor() {
    super({
      options: [
        {
          name: 'mode',
          description: `What to draw (Default: ${MediaAudioToImageModesToText[MediaAudioToImageModes.SPECTROGRAM]})`,
          ...I18n.optionLocalizations('commands.media_av.audio_to_image.mode'),
          choices: Parameters.Slash.oneOf({
            choices: MediaAudioToImageModes,
            descriptions: MediaAudioToImageModesToText,
            defaultChoice: MediaAudioToImageModes.SPECTROGRAM,
            localizationKey: 'choices.media_audio_to_image_modes',
          }),
        },
        {name: 'low', description: 'Frequency at the bottom of the image, 20 to 20000 hz (Default: 100)', ...I18n.optionLocalizations('commands.media_av.audio_to_image.low'), type: 'number'},
        {name: 'high', description: 'Frequency at the top of the image, 20 to 20000 hz (Default: 12000)', ...I18n.optionLocalizations('commands.media_av.audio_to_image.high'), type: 'number'},
        {
          name: 'scale',
          description: `How the rows are spread over the frequencies (Default: ${MediaImageToAudioScalesToText[MediaImageToAudioScales.LINEAR]})`,
          ...I18n.optionLocalizations('commands.media_av.audio_to_image.scale'),
          choices: Parameters.Slash.oneOf({
            choices: MediaImageToAudioScales,
            descriptions: MediaImageToAudioScalesToText,
            defaultChoice: MediaImageToAudioScales.LINEAR,
            localizationKey: 'choices.media_image_to_audio_scales',
          }),
        },
        {name: 'invert', description: 'Loud is dark instead of bright (Default: False)', ...I18n.optionLocalizations('commands.media_av.audio_to_image.invert'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsAudioToImage.CommandArgs) {
    return Formatter.Commands.MediaAVToolsAudioToImage.createMessage(context, args);
  }
}

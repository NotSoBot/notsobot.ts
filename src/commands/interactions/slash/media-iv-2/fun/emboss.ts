import { Interaction } from 'detritus-client';

import { MediaEmbossComposeMethods, MediaEmbossMethods } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'emboss';

export class MediaIVEmbossCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply an Emboss effect to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.emboss.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEmboss.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.emboss.name');
  
  constructor() {
    super({
      options: [
        {
          name: 'method',
          description: 'Emboss Method',
          ...I18n.optionLocalizations('commands.media_iv_2.fun.emboss.method'),
          choices: Parameters.Slash.oneOf({choices: MediaEmbossMethods, defaultChoice: MediaEmbossMethods.GIMP}),
        },
        {name: 'azimuth', description: 'Direction the light is coming from (0..360) (Default: 135)', ...I18n.optionLocalizations('commands.media_iv_2.fun.emboss.azimuth'), type: Number},
        {name: 'compose', description: 'Blend Method', ...I18n.optionLocalizations('commands.media_iv_2.fun.emboss.compose'), choices: Parameters.Slash.oneOf({choices: MediaEmbossComposeMethods})},
        {name: 'elevation', description: 'How high up the light is (0..90) (Default: 45)', ...I18n.optionLocalizations('commands.media_iv_2.fun.emboss.elevation'), type: Number},
        {name: 'depth', description: 'Effect Strength (0..100) (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_2.fun.emboss.depth'), type: Number},
        {name: 'intensity', description: 'Contrast Strength (-50..50) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.emboss.intensity'), type: Number},
        {name: 'gray', description: 'Brightness Level (0.0..1.0) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.emboss.gray'), type: 'number'},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEmboss.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEmboss.createMessage(context, args);
  }
}

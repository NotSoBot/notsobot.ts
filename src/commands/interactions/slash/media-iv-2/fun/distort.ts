import { Interaction } from 'detritus-client';

import { MediaDistortMethods } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'distort';

export class MediaIVDistortCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Use ImageMagick\'s Distort Operation on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.distort.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDistort.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.distort.name');
  
  constructor() {
    super({
      options: [
        {
          name: 'method',
          description: 'ImageMagick Distort Method',
          ...I18n.optionLocalizations('commands.media_iv_2.fun.distort.method'),
          choices: Object.values(MediaDistortMethods).map((value) => {
            return {name: value, value};
          }),
        },
        {name: 'arguments', description: 'Distort Arguments', ...I18n.optionLocalizations('commands.media_iv_2.fun.distort.arguments'), value: Parameters.arrayOfFloats},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDistort.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDistort.createMessage(context, args);
  }
}

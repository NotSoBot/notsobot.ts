import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'shake';

export class MediaIVShakeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shake an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.shake.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationShake.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.shake.name');
  
  constructor() {
    super({
      options: [
        {name: 'horizontal', description: 'Horizontal Magnitude', ...I18n.optionLocalizations('commands.media_iv_2.fun.shake.horizontal'), type: Number},
        {name: 'randomize', description: 'Randomize the Shake Magnitude', ...I18n.optionLocalizations('commands.media_iv_2.fun.shake.randomize'), type: Boolean},
        {name: 'vertical', description: 'Vertical Magnitude', ...I18n.optionLocalizations('commands.media_iv_2.fun.shake.vertical'), type: Number},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationShake.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationShake.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'invert-lab';

export class MediaIVInvertLABCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Invert each CIELAB channel with 1, or ignore with 0';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.invert_lab.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationInvertLAB.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.invert_lab.name');

  constructor() {
    super({
      options: [
        {name: 'lightness', description: 'Invert Lightness, keeping the colors', ...I18n.optionLocalizations('commands.media_iv.tint.invert_lab.lightness'), type: Number},
        {name: 'a', description: 'Invert A, swapping green and red', ...I18n.optionLocalizations('commands.media_iv.tint.invert_lab.a'), type: Number},
        {name: 'b', description: 'Invert B, swapping blue and yellow', ...I18n.optionLocalizations('commands.media_iv.tint.invert_lab.b'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationInvertLAB.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInvertLAB.createMessage(context, args);
  }
}

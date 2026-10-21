import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'invert-rgba';

export class MediaIVInvertRGBACommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Invert each individual channel with 1, or ignore with 0';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.invert_rgba.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationInvertRGBA.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.invert_rgba.name');

  constructor() {
    super({
      options: [
        {name: 'red', description: 'Invert Red Channel', ...I18n.optionLocalizations('commands.media_iv.tint.invert_rgba.red'), type: Number},
        {name: 'green', description: 'Invert Green Channel', ...I18n.optionLocalizations('commands.media_iv.tint.invert_rgba.green'), type: Number},
        {name: 'blue', description: 'Invert Blue Channel', ...I18n.optionLocalizations('commands.media_iv.tint.invert_rgba.blue'), type: Number},
        {name: 'alpha', description: 'Invert Alpha Channel', ...I18n.optionLocalizations('commands.media_iv.tint.invert_rgba.alpha'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationInvertRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInvertRGBA.createMessage(context, args);
  }
}

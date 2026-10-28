import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'prism';

export class MediaIVPrismCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Wrap an Image or Video around a spinning pyramid, like the obama prism';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.prism.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPrism.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.prism.name');

  constructor() {
    super({
      options: [
        {name: 'angle', description: 'How far it\'s turned, in degrees (-180..180) (Default: 30)', ...I18n.optionLocalizations('commands.media_iv_3.fun.prism.angle'), type: Number},
        {name: 'clockwise', description: 'Rotate the Media clockwise', ...I18n.optionLocalizations('commands.media_iv_3.fun.prism.clockwise'), type: Boolean},
        {name: 'repeat', description: 'Put the whole Media on every side instead of wrapping it around', ...I18n.optionLocalizations('commands.media_iv_3.fun.prism.repeat'), type: Boolean},
        {name: 'still', description: 'Don\'t spin, pose it turned slightly like the original picture', ...I18n.optionLocalizations('commands.media_iv_3.fun.prism.still'), type: Boolean},
        {name: 'tilt', description: 'How far it\'s looked down at, in degrees (0..90) (Default: 12)', ...I18n.optionLocalizations('commands.media_iv_3.fun.prism.tilt'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPrism.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPrism.createMessage(context, args);
  }
}

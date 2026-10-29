import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'wobble';

export class MediaIVWobbleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make an Image or Video Wobble like Jelly';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.wobble.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWobble.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.wobble.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'How Far it Wobbles, Percent of the Size (1..100) (Default: 40)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wobble.amount'), type: 'number'},
        {name: 'wobbles', description: 'Wobbles per Second (0.1..10.0) (Default: 0.8)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wobble.wobbles'), type: 'number'},
        {name: 'duration', description: 'Seconds, for Still Images (0.5..30.0) (Default: 3.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wobble.duration'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWobble.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWobble.createMessage(context, args);
  }
}

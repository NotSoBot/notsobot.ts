import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'loop';

export class MediaIVToolsSetLoopCommand extends BaseInteractionImageCommandOption {
  description = 'Set how many times an animated image plays';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.set.loop.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSetLoop.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.set.loop.name');

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: 'Times it plays, 0 is forever (Default: 0)',
          ...I18n.optionLocalizations('commands.media_iv_tools.set.loop.amount'),
          maxValue: 65535,
          minValue: 0,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSetLoop.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSetLoop.createMessage(context, args);
  }
}

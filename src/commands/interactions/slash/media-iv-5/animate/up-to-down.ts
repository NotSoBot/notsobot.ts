import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'up-to-down';

export class MediaIVUpToDownCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Flip an Image or Video back and forth vertically';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.animate.up_to_down.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationUpToDown.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.animate.up_to_down.name');

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Frame Delay in ms (20..10000) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_5.animate.up_to_down.delay'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationUpToDown.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUpToDown.createMessage(context, args);
  }
}

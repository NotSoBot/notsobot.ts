import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'offset';

export class MediaIVToolsOffsetCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Offset an Image or Video by X or Y amount';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.offset.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOffset.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.offset.name');

  constructor() {
    super({
      options: [
        {name: 'x', description: 'X Offset', ...I18n.optionLocalizations('commands.media_iv_tools.offset.x')},
        {name: 'y', description: 'Y Offset', ...I18n.optionLocalizations('commands.media_iv_tools.offset.y')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOffset.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOffset.createMessage(context, args);
  }
}

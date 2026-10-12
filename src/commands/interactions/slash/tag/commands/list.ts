import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class TagCommandsListCommand extends BaseInteractionCommandOption {
  description = 'List all of the current server\'s custom commands';
  descriptionLocalizations = I18n.localizations('commands.tag.commands.list.description');
  metadata = {
    id: Formatter.Commands.TagCommandsList.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.commands.list.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.TagCommandsList.createMessage(context, {});
  }
}

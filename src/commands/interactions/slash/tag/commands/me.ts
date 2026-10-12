import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'me';

export class TagCommandsMeCommand extends BaseInteractionCommandOption {
  description = 'List all of your global custom commands';
  descriptionLocalizations = I18n.localizations('commands.tag.commands.me.description');
  metadata = {
    id: Formatter.Commands.TagCommandsListMe.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.commands.me.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.TagCommandsListMe.createMessage(context, {});
  }
}

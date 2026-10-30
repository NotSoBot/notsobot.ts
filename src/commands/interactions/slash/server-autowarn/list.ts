import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ServerAutowarnListCommand extends BaseInteractionCommandOption {
  description = 'List this server\'s auto-warn rules';
  descriptionLocalizations = I18n.localizations('commands.autowarn.list.description');
  metadata = {
    id: Formatter.Commands.ModerationAutowarn.COMMAND_ID,
  };
  name = 'list';
  nameLocalizations = I18n.localizations('commands.autowarn.list.name');
  permissions = [Permissions.MANAGE_GUILD];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.ModerationAutowarn.createMessage(context);
  }
}

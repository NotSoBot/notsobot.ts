import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Blocklist Add';

export default class BlocklistAddCommand extends BaseContextMenuUserCommand {
  disableDm = true;
  metadata = {
    id: Formatter.Commands.ModerationBlocklistAddUsers.COMMAND_ID,
  };
  name = COMMAND_NAME;
  permissions = [Permissions.ADMINISTRATOR];

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}

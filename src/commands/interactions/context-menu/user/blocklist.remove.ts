import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Blocklist Remove';

export default class BlocklistRemoveCommand extends BaseContextMenuUserCommand {
  disableDm = true;
  name = COMMAND_NAME;
  permissions = [Permissions.ADMINISTRATOR];

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}

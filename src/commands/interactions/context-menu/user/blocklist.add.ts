import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseCommand, CommandArgs } from './basecommand';


export const COMMAND_NAME = 'Blocklist Add';

export default class BlocklistAddCommand extends BaseCommand {
  disableDm = true;
  name = COMMAND_NAME;
  permissions = [Permissions.ADMINISTRATOR];

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}

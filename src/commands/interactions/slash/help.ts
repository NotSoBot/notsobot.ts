import { Interaction } from 'detritus-client';

import { editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'help';

export default class HelpCommand extends BaseSlashCommand {
  description = 'Help';
  name = COMMAND_NAME;

  run(context: Interaction.InteractionContext) {
    return editOrReply(context, '<https://notsobot.com/commands> (Join our support server <https://notsobot.com/support/invite>)');
  }
}

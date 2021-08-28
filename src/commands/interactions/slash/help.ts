import { Interaction } from 'detritus-client';

import { editOrReply } from '../../../utils';

import { BaseCommand } from './basecommand';


export const COMMAND_NAME = 'help';

export default class HelpCommand extends BaseCommand {
  description = 'Help';
  name = COMMAND_NAME;

  run(context: Interaction.InteractionContext) {
    return editOrReply(context, 'This is our rewrite bot. <https://beta.notsobot.com/commands> (Join our support server <https://beta.notsobot.com/support/invite>)');
  }
}

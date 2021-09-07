import { Interaction } from 'detritus-client';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {

}

export class TagListGuildCommand extends BaseInteractionCommandOption {
  description = 'List all the guild\'s tags';
  name = 'guild';

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.editOrRespond({
      content: 'wip',
      flags: 64,
    });
  }
}

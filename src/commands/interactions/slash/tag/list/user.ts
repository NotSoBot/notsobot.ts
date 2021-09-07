import { Interaction, Structures } from 'detritus-client';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  global?: boolean,
  user: Structures.Member | Structures.User,
}

export class TagListUserCommand extends BaseInteractionCommandOption {
  description = 'List all of a user\'s tags';
  name = 'user';

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.editOrRespond({
      content: 'wip',
      flags: 64,
    });
  }
}

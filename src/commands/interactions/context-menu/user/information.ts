import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Information';

export default class InformationCommand extends BaseContextMenuUserCommand {
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    return Formatter.Commands.InfoUser.createMessage(context, {
      isEphemeral: true,
      user: args.member || args.user,
    });
  }
}

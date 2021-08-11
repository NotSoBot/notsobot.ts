import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseCommand, CommandArgs } from './basecommand';


export const COMMAND_NAME = 'Information';

export default class InformationCommand extends BaseCommand {
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.InfoUser.createMessage(context, {
      isEphemeral: true,
      user: args.member || args.user,
    });
  }
}

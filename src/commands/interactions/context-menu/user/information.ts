import { Interaction } from 'detritus-client';


import { BaseCommand, CommandArgs } from './basecommand';


export const COMMAND_NAME = 'Information';

export default class InformationCommand extends BaseCommand {
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.editOrRespond({
      content: `info about ${args.member || args.user}`,
      flags: 64,
    });
  }
}

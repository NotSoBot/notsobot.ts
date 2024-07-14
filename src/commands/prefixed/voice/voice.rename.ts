import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'voice rename';

export default class VoiceRenameCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Rename one cloned voice to another name',
        examples: [
          `${COMMAND_NAME} chewbacca ralph`,
        ],
        id: Formatter.Commands.VoiceRename.COMMAND_ID,
        usage: '<voice:string> <...name:string>',
      },
      type: [
        {name: 'voice'},
        {name: 'name', consume: true},
      ],
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceRename.CommandArgs) {
    return !!args.voice && !!args.name;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceRename.CommandArgs) {
    return Formatter.Commands.VoiceRename.createMessage(context, args);
  }
}

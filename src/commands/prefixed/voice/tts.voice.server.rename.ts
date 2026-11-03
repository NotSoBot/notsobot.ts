import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice server rename';

export default class TTSVoiceServerRenameCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server voice rename'],

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Rename one of the server\'s cloned voices',
        examples: [
          `${COMMAND_NAME} chewbacca ralph`,
        ],
        id: Formatter.Commands.VoiceServer.COMMAND_ID_RENAME,
        usage: '<voice:string> <...name:string>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: [
        {name: 'voice'},
        {name: 'name', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceRename.CommandArgs) {
    return !!args.voice && !!args.name;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceRename.CommandArgs) {
    return Formatter.Commands.VoiceRename.createMessage(context, {...args, server: true});
  }
}

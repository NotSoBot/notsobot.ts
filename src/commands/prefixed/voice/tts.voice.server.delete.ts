import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice server delete';

export default class TTSVoiceServerDeleteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server voice delete'],

      disableDm: true,
      label: 'voice',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Delete one of the server\'s cloned voices',
        examples: [
          `${COMMAND_NAME} cake`,
        ],
        id: Formatter.Commands.VoiceServer.COMMAND_ID_DELETE,
        usage: '<voice:string>',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return !!args.voice;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return Formatter.Commands.VoiceDelete.createMessage(context, {...args, server: true});
  }
}

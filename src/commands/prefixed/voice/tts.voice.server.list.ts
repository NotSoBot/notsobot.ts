import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice server list';

export default class TTSVoiceServerListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server voice list'],

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'List the server\'s cloned voices',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.VoiceServer.COMMAND_ID_LIST,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceList.CommandArgs) {
    return Formatter.Commands.VoiceList.createMessage(context, {...args, server: true});
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice list';

export default class TTSVoiceListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['voice list'],

      metadata: {
        category: CommandCategories.AUDIO,
        description: 'List your stored cloned voices',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.VoiceList.COMMAND_ID,
        premiumPlus: true,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceList.CommandArgs) {
    return Formatter.Commands.VoiceList.createMessage(context, args);
  }
}

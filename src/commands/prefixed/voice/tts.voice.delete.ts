import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice delete';

export default class TTSVoiceDeleteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['voice delete'],

      label: 'voice',
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Delete one of your stored cloned voices',
        examples: [
          `${COMMAND_NAME} cake`,
        ],
        id: Formatter.Commands.VoiceDelete.COMMAND_ID,
        premiumPlus: true,
        usage: '<voice:string>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return !!args.voice;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return Formatter.Commands.VoiceDelete.createMessage(context, args);
  }
}

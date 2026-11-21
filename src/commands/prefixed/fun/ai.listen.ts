import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ai listen';

// Owner only until it's released (the formatter checks, so anyone else's `ai listen ...` still goes to NotSoAI as a
// prompt starting with "listen")
export default class AIListenCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'text',
      metadata: {
        category: CommandCategories.OWNER,
        pipeable: false,
        description: 'Talk to NotSoAI in your voice channel: it answers what you say out loud in your Default TTS Voice (over the music, turned down under it) and runs its replies in this channel. Listens for 10 minutes, `stop` ends it sooner',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} stop`,
        ],
        id: Formatter.Commands.AIListen.COMMAND_ID,
        usage: '?<stop>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.AIListen.CommandArgs) {
    return Formatter.Commands.AIListen.createMessage(context, args);
  }
}

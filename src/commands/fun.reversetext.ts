import { Command } from 'detritus-client';
import {CommandTypes} from "../constants";


export default (<Command.CommandOptions> {
  name: 'reversetext',
  aliases: ['reverse', 'r'],
  label: 'text',
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  metadata: {
    description: 'Reverse some text',
    examples: [
        'reverse NotSoBot.ts'
    ],
    type: CommandTypes.FUN,
    usage: 'reverse ?<text>'
  },
  onCancelRun: (context) => context.editOrReply('No input.'),
  run: async (context) => {
    return context.editOrReply(context.message.toString().split('').reverse().join(''))
  },
});

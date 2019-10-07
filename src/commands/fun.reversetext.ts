import { Command } from 'detritus-client';
import { CommandTypes } from '../constants';


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
    description: 'Reverse text',
    examples: [
        'r NotSoBot'
    ],
    type: CommandTypes.FUN,
  },
  onCancelRun: (context) => context.editOrReply('Provide some text.'),
  run: async (context) => {
    return context.editOrReply(context.message.toString().split('').reverse().join())
  },
});

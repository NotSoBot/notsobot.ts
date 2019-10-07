import { Command, Utils } from 'detritus-client';
const { Markup } = Utils;

import { CommandTypes } from '../constants';


export interface CommandArgs {
  text: string,
}

export default (<Command.CommandOptions> {
  name: 'reversetext',
  aliases: ['reverse', 'r'],
  label: 'text',
  metadata: {
    description: 'Reverse text',
    examples: [
      'reversetext NotSoBot',
    ],
    type: CommandTypes.FUN,
    usage: 'reversetext <text>',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  onBeforeRun: (context, args) => !!args.text,
  onCancelRun: (context) => context.editOrReply('Provide some text.'),
  run: async (context, args: CommandArgs) => {
    const text = context.message.convertContent({text: args.text});
    const reversed = text.split('').reverse().join('');
    return context.editOrReply(Markup.escape.all(reversed));
  },
});

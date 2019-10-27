import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  text: string,
}

export default (<Command.CommandOptions> {
  name: 'milksay',
  aliases: ['milk'],
  label: 'text',
  metadata: {
    description: '',
    examples: [
      'milksay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'milksay <text>',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  onBefore: (context) => context.user.isClientOwner,
  run: async (context, args: CommandArgs) => {
    return context.reply(args.text);
  },
  onRunError,
});

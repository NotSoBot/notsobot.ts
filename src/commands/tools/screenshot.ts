import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'screenshot',
  aliases: ['ss'],
  label: 'url',
  metadata: {
    description: 'Take a screenshot of a website',
    examples: [
      'hash lolol',
      'hash lolol -use sha256',
    ],
    type: CommandTypes.TOOLS,
    usage: 'screenshot <url>',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  onBefore: (context) => context.user.isClientOwner,
  run: async (context, args: CommandArgs) => {
    return context.reply('ok');
  },
  onRunError,
});

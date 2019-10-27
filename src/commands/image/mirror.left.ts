import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'mirror left',
  aliases: ['waaw'],
  label: 'url',
  metadata: {
    description: 'Mirror left half of image',
    examples: [
      'waaw',
      'waaw cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'waaw ?<emoji|id|mention|name|url>',
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

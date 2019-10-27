import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'mirror right',
  aliases: ['haah'],
  label: 'url',
  metadata: {
    description: 'Mirror right half of image',
    examples: [
      'haah',
      'haah cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'haah ?<emoji|id|mention|name|url>',
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
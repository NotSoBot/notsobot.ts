import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'mirror bottom',
  aliases: ['hooh'],
  label: 'url',
  metadata: {
    description: 'Mirror bottom of image',
    examples: [
      'hooh',
      'hooh cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'hooh ?<emoji|id|mention|name|url>',
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

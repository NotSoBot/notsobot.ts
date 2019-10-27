import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'pixel',
  args: [
    {name: 'amount', type: Number},
  ],
  label: 'url',
  metadata: {
    description: 'Pixelate?',
    examples: [
      'pixel',
      'pixel cake',
      'pixel cake -amount 2',
    ],
    type: CommandTypes.IMAGE,
    usage: 'pixel ?<emoji|id|mention|name|url> (-amount <number>)',
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

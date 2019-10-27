import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'triggered',
  args: [
    {name: 'type'},
  ],
  label: 'url',
  metadata: {
    examples: [
      'triggered',
      'triggered cake',
      'triggered cake -type 2',
    ],
    type: CommandTypes.IMAGE,
    usage: 'triggered ?<emoji|id|mention|name|url> (-type <triggered-type>)',
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
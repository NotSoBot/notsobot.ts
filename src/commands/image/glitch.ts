import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'glitch',
  args: [
    {name: 'amount', type: Number},
    {name: 'iterations', type: Number},
    {name: 'seed', type: Number},
    {name: 'type'},
  ],
  label: 'url',
  metadata: {
    description: 'Glitch an Image',
    examples: [
      'glitch',
      'glitch cake',
      'glitch cake -type 2',
    ],
    type: CommandTypes.IMAGE,
    usage: 'glitch ?<emoji|id|mention|name|url> (-amount <number>) (-iterations <number>) (-seed <number>) (-type <glitch-type>)',
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

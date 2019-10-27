import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  query: string,
}

export default (<Command.CommandOptions> {
  name: 'rule34paheal',
  aliases: ['r34p', 'rule34paheal', 'paheal', 'pahe'],
  label: 'query',
  metadata: {
    description: 'Search https://rule34.paheal.net',
    examples: [
      'rule34paheal some anime chick',
    ],
    type: CommandTypes.SEARCH,
    usage: 'rule34paheal <query>',
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

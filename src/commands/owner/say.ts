import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export interface CommandArgs {
  text: string,
}

export default (<Command.CommandOptions> {
  name: 'say',
  label: 'text',
  metadata: {
    description: 'Have the bot say something (owner only bc exploits)',
    examples: [
      'say :spider:',
    ],
    type: CommandTypes.OWNER,
    usage: 'say <text>'
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

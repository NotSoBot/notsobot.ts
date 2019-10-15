import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'ping',
  metadata: {
    description: 'Ping Discord\'s Gateway and Rest api',
    examples: [
      'ping',
    ],
    type: CommandTypes.UTILS,
    usage: 'ping',
  },
  ratelimits: [
    {
      duration: 5000,
      limit: 5,
      type: 'guild',
    },
    {
      duration: 1000,
      limit: 1,
      type: 'channel',
    },
  ],
  run: async (context) => {
    const {gateway, rest} = await context.client.ping();
    return context.editOrReply(`pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
  },
  onRunError,
});

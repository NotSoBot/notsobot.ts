import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'tag',
  metadata: {
    description: 'Show a tag',
    examples: [
      'tag some tag',
    ],
    type: CommandTypes.FUN,
    usage: 'tag <...tagname>',
  },
  priority: 1,
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  run: async (context) => context.reply('maybe some day'),
  onRunError,
});

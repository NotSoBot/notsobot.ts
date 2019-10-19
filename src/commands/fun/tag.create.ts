import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export default (<Command.CommandOptions> {
  prefixes: ['tag', 't'],
  prefixSpace: true,
  name: 'create',
  metadata: {
    description: 'Create a tag',
    examples: [
      'tag create test im a tag',
    ],
    type: CommandTypes.FUN,
    usage: 'tag create <tagname|"tag name"> <...body>',
  },
  priority: 1,
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  run: async (context) => context.reply('maybe'),
  onRunError,
});

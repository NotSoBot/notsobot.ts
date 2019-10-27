import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'undo',
  metadata: {
    description: 'Undo your last command',
    type: CommandTypes.UTILS,
    usage: 'undo',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  run: (context) => context.reply('ok'),
  onRunError,
});

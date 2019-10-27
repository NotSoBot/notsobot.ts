import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'invite',
  metadata: {
    description: 'Invite to Guild Link',
    type: CommandTypes.UTILS,
    usage: 'invite',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  run: (context) => context.reply(`${context.user.mention}, <https://beta.notsobot.com/invite>`),
  onRunError,
});

import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export default class InviteCommand extends BaseCommand {
  name = 'invite';
  metadata = {
    description: 'Invite to Guild Link',
    type: CommandTypes.UTILS,
    usage: 'invite',
  };

  run(context: Command.Context) {
    return context.reply(`${context.user.mention}, <https://beta.notsobot.com/invite>`);
  }
}

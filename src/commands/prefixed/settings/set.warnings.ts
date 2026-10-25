import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set warnings';

export default class SetWarningsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'expire', aliases: ['expiry', 'delete'], type: Formatter.Commands.SettingsServerSetWarnings.expireParser},
        {name: 'window', aliases: ['active'], type: Formatter.Commands.SettingsServerSetWarnings.windowParser},
        {name: 'step', aliases: ['at'], type: Number},
        {name: 'action', aliases: ['do'], type: Formatter.Commands.SettingsServerSetWarnings.actionParser},
        {name: 'duration', aliases: ['for'], type: Formatter.Commands.SettingsServerSetWarnings.durationParser},
        {name: 'clean', type: Formatter.Commands.SettingsServerSetWarnings.durationParser},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change how long warnings count as active (default 30 days), when they get deleted (default never), and what happens once a member has a number of active warnings (mute, kick, or ban, skipped when the moderator couldn\'t do it themselves)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -window 14 days`,
          `${COMMAND_NAME} -expire 1 year`,
          `${COMMAND_NAME} -expire never`,
          `${COMMAND_NAME} -step 3 -action mute -duration 1h`,
          `${COMMAND_NAME} -step 5 -action kick -clean 1d`,
          `${COMMAND_NAME} -step 10 -action ban -duration 7d`,
          `${COMMAND_NAME} -step 3 -action remove`,
        ],
        id: Formatter.Commands.SettingsServerSetWarnings.COMMAND_ID,
        usage: '(-expire <duration|never>) (-window <duration>) (-step <count> -action <mute|kick|ban|remove> (-duration <duration>) (-clean <duration>))',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetWarnings.CommandArgs) {
    return Formatter.Commands.SettingsServerSetWarnings.createMessage(context, args);
  }
}

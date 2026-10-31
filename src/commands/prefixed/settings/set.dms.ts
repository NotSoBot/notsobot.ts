import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set dms';

export default class SetDmsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'dm', aliases: ['dms'], type: Formatter.Commands.SettingsServerSetDms.dmParser},
        {name: 'for', type: Formatter.Commands.SettingsServerSetDms.forParser},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change which moderation DMs members get: bans, kicks, mutes, warnings and auto-warnings (all on by default)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -dm off`,
          `${COMMAND_NAME} -dm off -for kick`,
          `${COMMAND_NAME} -dm on -for warn`,
        ],
        id: Formatter.Commands.SettingsServerSetDms.COMMAND_ID,
        usage: '(-dm <on|off> (-for <ban|kick|mute|warn|autowarn>))',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetDms.CommandArgs) {
    return Formatter.Commands.SettingsServerSetDms.createMessage(context, args);
  }
}

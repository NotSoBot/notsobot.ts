import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildWarningAutoTriggers } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'autowarn mentions';

export interface CommandArgs {
  channel?: Structures.Channel | null,
  'exempt-permissions'?: bigint,
  'exempt-roles'?: Array<Structures.Role>,
  limit: number,
  warnings?: number,
}

export default class AutowarnMentionsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autowarn mention', 'autowarn pings'],
      args: [
        {name: 'channel', type: Parameters.channel({types: Formatter.Commands.ModerationAutowarn.CHANNEL_TYPES as any})},
        {name: 'warnings', aliases: ['warns', 'cost'], type: Number},
        {name: 'exempt-roles', aliases: ['skip-roles'], type: Formatter.Commands.ModerationAutowarn.exemptRolesParser},
        {name: 'exempt-permissions', aliases: ['skip-permissions'], type: Formatter.Commands.ModerationAutowarn.exemptPermissionsParser},
      ],
      disableDm: true,
      label: 'limit',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Warn members that mention more than this many users and roles in one message, server-wide or in a channel (covers its threads, or a category\'s channels)',
        examples: [
          `${COMMAND_NAME} 5`,
          `${COMMAND_NAME} 5 -warnings 2`,
          `${COMMAND_NAME} 3 -channel general -warnings 3`,
          `${COMMAND_NAME} 5 -channel announcements -exempt-roles @Event Hosts`,
          `${COMMAND_NAME} 5 -exempt-roles none`,
        ],
        id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_MENTIONS,
        usage: '<limit> (-warnings <count>) (-channel <channel:id|mention|name>) (-exempt-roles ...<role:id|mention|name>|none) (-exempt-permissions <permission, ...|none>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Number,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return args.channel !== null;
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      channel: args.channel || null,
      exemptPermissions: args['exempt-permissions'],
      exemptRoles: args['exempt-roles'],
      limit: args.limit,
      trigger: GuildWarningAutoTriggers.MENTIONS,
      warnings: args.warnings,
    });
  }
}

import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildWarningAutoTriggers } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'autowarn automod';

export interface CommandArgs {
  channel?: Structures.Channel | null,
  'exempt-permissions'?: bigint,
  'exempt-roles'?: Array<Structures.Role>,
  rule?: Formatter.Commands.ModerationAutowarn.AutomodRuleChoice,
  warnings?: number,
}

export default class AutowarnAutomodCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autowarn auto-mod'],
      args: [
        {name: 'rule', type: Formatter.Commands.ModerationAutowarn.automodRuleParser},
        {name: 'channel', type: Parameters.channel({types: Formatter.Commands.ModerationAutowarn.CHANNEL_TYPES as any})},
        {name: 'warnings', aliases: ['warns', 'cost'], type: Number},
        {name: 'exempt-roles', aliases: ['skip-roles'], type: Formatter.Commands.ModerationAutowarn.exemptRolesParser},
        {name: 'exempt-permissions', aliases: ['skip-permissions'], type: Formatter.Commands.ModerationAutowarn.exemptPermissionsParser},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Warn members that set off one of the server\'s discord AutoMod rules (or a specific one), server-wide or in a channel (covers its threads, or a category\'s channels). I need Manage Server to see AutoMod',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -warnings 2`,
          `${COMMAND_NAME} -rule Bad Words -warnings 5`,
          `${COMMAND_NAME} -rule Bad Words -channel general`,
        ],
        id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_AUTOMOD,
        usage: '(-rule <automod rule:id|name>) (-warnings <count>) (-channel <channel:id|mention|name>) (-exempt-roles ...<role:id|mention|name>|none) (-exempt-permissions <permission, ...|none>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return args.channel !== null;
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      automodRule: args.rule,
      channel: args.channel || null,
      exemptPermissions: args['exempt-permissions'],
      exemptRoles: args['exempt-roles'],
      trigger: GuildWarningAutoTriggers.AUTOMOD,
      warnings: args.warnings,
    });
  }
}

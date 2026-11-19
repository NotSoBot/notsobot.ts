import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildWarningAutoTriggers } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'autowarn decoy';

export interface CommandArgs {
  'exempt-permissions'?: bigint,
  'exempt-roles'?: Array<Structures.Role>,
  warnings?: number,
}

export default class AutowarnDecoyCommand extends BaseCommand {
  // NotSoBot's owners don't skip the member permissions here, it can wreck a server
  permissionsIgnoreClientOwner = false;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'warnings', aliases: ['warns', 'cost'], type: Number},
        {name: 'exempt-roles', aliases: ['skip-roles'], type: Formatter.Commands.ModerationAutowarn.exemptRolesParser},
        {name: 'exempt-permissions', aliases: ['skip-permissions'], type: Formatter.Commands.ModerationAutowarn.exemptPermissionsParser},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Also warn members removed for posting in the decoy channel (`decoy create`), counting towards the warning actions',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -warnings 3`,
          `${COMMAND_NAME} -exempt-roles @Trusted`,
        ],
        id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_DECOY,
        usage: '(-warnings <count>) (-exempt-roles ...<role:id|mention|name>|none) (-exempt-permissions <permission, ...|none>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      channel: null,
      exemptPermissions: args['exempt-permissions'],
      exemptRoles: args['exempt-roles'],
      trigger: GuildWarningAutoTriggers.DECOY,
      warnings: args.warnings,
    });
  }
}

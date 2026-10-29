import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'autowarn exempt';

export interface CommandArgs {
  clear?: boolean,
  permissions?: bigint,
  roles?: Array<Structures.Role>,
}

export default class AutowarnExemptCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autowarn skip'],
      args: [
        {name: 'clear', type: Boolean},
        {name: 'permissions', aliases: ['permission'], type: Formatter.Commands.ModerationAutowarn.exemptPermissionsParser},
        {name: 'roles', aliases: ['role'], type: Formatter.Commands.ModerationAutowarn.exemptRolesParser},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change who every auto-warn rule skips: members with any of these roles or any of these permissions (rules can skip more on their own)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -roles @Mods @Event Hosts`,
          `${COMMAND_NAME} -permissions manage messages, mention everyone`,
          `${COMMAND_NAME} -roles none`,
          `${COMMAND_NAME} -clear`,
        ],
        id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_EXEMPT,
        usage: '(-roles ...<role:id|mention|name>|none) (-permissions <permission, ...|none>) (-clear)',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createExemptMessage(context, args);
  }
}

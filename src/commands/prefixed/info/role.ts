import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'role';

export default class RoleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: DefaultParameters.defaultRole,
      disableDm: true,
      metadata: {
        description: 'Get information about a role, defaults to the @everyone role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} everyone`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoRole.COMMAND_ID,
        usage: '?<role:id|mention|name>',
      },
      type: Parameters.role,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoRole.CommandArgsBefore) {
    return !!args.role;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoRole.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.role_not_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoRole.CommandArgs) {
    return Formatter.Commands.InfoRole.createMessage(context, args);
  }
}

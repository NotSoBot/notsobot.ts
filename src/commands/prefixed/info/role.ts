import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'role';

export default class RoleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'channel', default: DefaultParameters.channel, type: Parameters.channel()},
      ],
      default: DefaultParameters.defaultRole,
      disableDm: true,
      metadata: {
        description: 'Get information for a role, defaults to the @everyone role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} everyone`,
          `${COMMAND_NAME} everyone -channel lobby`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoRole.COMMAND_ID,
        usage: '?<role:id|mention|name> (-channel ?<channel:id|mention|name>)',
      },
      type: Parameters.role,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoRole.CommandArgsBefore) {
    return !!args.channel && !!args.role;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoRole.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.channel) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.channel_not_found')}`);
    } else if (!args.role) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.role_not_found')}`);
    } else {
      return super.onCancelRun(context, args);
    }
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoRole.CommandArgs) {
    return Formatter.Commands.InfoRole.createMessage(context, args);
  }
}

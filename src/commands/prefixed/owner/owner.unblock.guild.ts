import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner unblock guild';

export default class OwnerBlockGuildCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: DefaultParameters.guild,
      label: 'guild',
      metadata: {
        description: 'Unblock a guild from the bot',
        examples: [
          `${COMMAND_NAME} 178313653177548800`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerUnblockGuild.COMMAND_ID,
        usage: '<guild:id>',
      },
      type: Parameters.guild,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.OwnerUnblockGuild.CommandArgsBefore) {
    return !!args.guild;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerUnblockGuild.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.guild) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerUnblockGuild.CommandArgs) {
    return Formatter.Commands.OwnerUnblockGuild.createMessage(context, args);
  }
}

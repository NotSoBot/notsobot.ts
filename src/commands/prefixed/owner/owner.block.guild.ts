import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner block guild';

export default class OwnerBlockGuildCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: DefaultParameters.guild,
      label: 'guild',
      metadata: {
        description: 'Block a guild from the bot',
        examples: [
          `${COMMAND_NAME} 178313653177548800`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerBlockGuild.COMMAND_ID,
        usage: '<guild:id>',
      },
      type: Parameters.guild,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.OwnerBlockGuild.CommandArgsBefore) {
    return !!args.guild;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerBlockGuild.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.guild) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerBlockGuild.CommandArgs) {
    return Formatter.Commands.OwnerBlockGuild.createMessage(context, args);
  }
}

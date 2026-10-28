import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'emojis';

export default class EmojisCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.OWNER,
        description: 'Search through all emojis that NotSoBot sees',
        examples: [
          `${COMMAND_NAME} pepe`,
        ],
        id: Formatter.Commands.SearchDiscordEmojis.COMMAND_ID,
        usage: '<emoji:id|name>',
      },
      type: Formatter.Commands.SearchDiscordEmojis.emojisSearch,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    return !!args.emojis.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('owner.no_emojis')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    return Formatter.Commands.SearchDiscordEmojis.createMessage(context, args);
  }
}

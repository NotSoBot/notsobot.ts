import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'emojis';

export default class EmojisCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.OWNER,
        description: 'Search through all emoji\'s that NotSoBot sees.',
        examples: [
          `${COMMAND_NAME} pepe`,
        ],
        id: Formatter.Commands.SearchDiscordEmojis.COMMAND_ID,
        usage: '<emoji:id|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Formatter.Commands.SearchDiscordEmojis.emojisSearch,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    return !!args.emojis.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    return editOrReply(context, '⚠ Couldn\'t find any emojis matching that.');
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    return Formatter.Commands.SearchDiscordEmojis.createMessage(context, args);
  }
}

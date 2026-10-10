import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories, GuildFeatures, UserFlags } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import TagCustomCommandStore, { TagCustomCommandStored } from '../../../stores/tagcustomcommands';
import UserStore from '../../../stores/users';
import { Formatter, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = '';

export default class TagShowCustomCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Execute a custom command tag',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.TagShowCustomCommand.COMMAND_ID,
        usage: '<tagname> <...arguments>',
      },
    });
  }

  async onBeforeRun(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore) {
    args.tag = null;
    args.arguments = args.text;

    if (!args.text) {
      return false;
    }

    // move these shouldSearch checks to their own functions
    if (context.guildId) {
      const tags = await TagCustomCommandStore.maybeGetOrFetchGuildCommands(context, context.guildId);
      if (tags) {
        const tag = Formatter.Commands.TagShowCustomCommand.findTagFromText(args.text, tags);
        if (tag) {
          args.tag = tag;
          args.arguments = args.text.slice(tag.name.length).trim();
          return true;
        }
      }
    }

    {
      const tags = await TagCustomCommandStore.maybeGetOrFetchUserCommands(context, context.userId);
      if (tags) {
        const tag = Formatter.Commands.TagShowCustomCommand.findTagFromText(args.text, tags);
        if (tag) {
          args.tag = tag;
          args.arguments = args.text.slice(tag.name.length).trim();
          return true;
        }
      }
    }

    return false;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore) {
    return undefined as any;
  }

  async run(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgs) {
    return editOrReply(context, `
### ⚠️ The tag system has been disabled at this time at Discord's request.
Discord gave us two weeks to remove the tag system due to content moderation concerns. We've since added new safety filters and reached out to Discord about keeping the feature. We're sorry for the disruption, especially to everyone who built games and collections with tags. For updates or questions, join our support server: <https://notsobot.com/support/invite>
`
    );

    return Formatter.Commands.TagShowCustomCommand.createMessage(context, args);
  }

  async onRatelimit(context: Command.Context) {
    return;
  }
}

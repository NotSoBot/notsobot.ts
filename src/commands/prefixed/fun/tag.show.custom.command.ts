import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories, GuildFeatures, UserFlags } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import TagCustomCommandStore, { TagCustomCommandStored } from '../../../stores/tagcustomcommands';
import UserStore from '../../../stores/users';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = '';

// this command is the fallback for every prefixed message that matches no other command (`.hello`, `...`), only the
// ones that found a custom command are logged as a use. `onFinally` only gets the context
const MATCHED_CONTEXTS = new WeakSet<Command.Context>();

export default class TagShowCustomCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.TAGS,
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
          MATCHED_CONTEXTS.add(context);
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
          MATCHED_CONTEXTS.add(context);
          return true;
        }
      }
    }

    return false;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore) {
    return undefined as any;
  }

  async onFinally(context: Command.Context) {
    // logging every unmatched message cost an api call (2 postgres reads and a clickhouse insert) each
    if (MATCHED_CONTEXTS.has(context)) {
      return super.onFinally(context);
    }
  }

  async run(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgs) {
    return Formatter.Commands.TagShowCustomCommand.createMessage(context, args);
  }

  async onRatelimit(context: Command.Context) {
    return;
  }
}

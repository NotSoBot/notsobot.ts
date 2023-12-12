import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories, GuildFeatures, UserFlags } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import TagCustomCommandStore, { TagCustomCommandStored } from '../../../stores/tagcustomcommands';
import UserStore from '../../../stores/users';
import { Formatter } from '../../../utils';

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

    if (context.guildId) {
      let shouldSearchGuild: boolean = false;

      const guildId = context.guildId!;
      const settings = await GuildSettingsStore.getOrFetch(context, guildId);
      if (settings && settings.features.has(GuildFeatures.FREE_CUSTOM_COMMANDS)) {
        shouldSearchGuild = true;
      } else {
        const guild = context.guild!;
        if (guild) {
          // get owner
          const owner = await UserStore.getOrFetch(context, guild.ownerId);
          if (owner && (owner.hasFlag(UserFlags.OWNER) || owner.hasFlag(UserFlags.PREMIUM_DISCORD))) {
            shouldSearchGuild = true;
          }
        }
      }

      if (shouldSearchGuild) {
        const tags = await TagCustomCommandStore.getOrFetchGuildCommands(context, context.guildId);
        if (tags) {
          const tag = findTag(args.text, tags);
          if (tag) {
            args.tag = tag;
            args.arguments = args.text.slice(tag.name.length).trim();
            return true;
          }
        }
      }
    }

    {
      let shouldSearchUser: boolean = false;

      const user = await UserStore.getOrFetch(context, context.userId);
      if (user && (user.hasFlag(UserFlags.OWNER) || user.hasFlag(UserFlags.PREMIUM_DISCORD))) {
        shouldSearchUser = true;
      }

      if (shouldSearchUser) {
        const tags = await TagCustomCommandStore.getOrFetchUserCommands(context, context.userId);
        if (tags) {
          const tag = findTag(args.text, tags);
          if (tag) {
            args.tag = tag;
            args.arguments = args.text.slice(tag.name.length).trim();
            return true;
          }
        }
      }
    }

    return false;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore) {
    return undefined as any;
  }

  async run(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgs) {
    return Formatter.Commands.TagShowCustomCommand.createMessage(context, args);
  }

  async onRunError(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgs, error: any) {
    await Formatter.Commands.TagShowCustomCommand.increaseUsage(context, args.tag);
    return super.onRunError(context, args, error);
  }

  async onSuccess(context: Command.Context, args: Formatter.Commands.TagShowCustomCommand.CommandArgs) {
    await Formatter.Commands.TagShowCustomCommand.increaseUsage(context, args.tag);
    return super.onSuccess(context, args);
  }

  async onRatelimit(context: Command.Context) {
    return;
  }
}


function findTag(text: string, tags: TagCustomCommandStored): RestResponsesRaw.Tag | null {
  const insensitive = text.trim().toLowerCase();
  for (let tag of tags.sort((x, y) => y.name.length - x.name.length)) {
    if (
      (insensitive.length === tag.name.length && insensitive === tag.name) ||
      insensitive.startsWith(`${tag.name} `)
    ) {
      return tag;
    }
  }
  return null;
}

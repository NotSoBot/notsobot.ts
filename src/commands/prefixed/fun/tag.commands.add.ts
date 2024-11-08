import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { BooleanEmojis, CommandCategories, GuildFeatures, UserFlags } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import UserStore from '../../../stores/users';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag commands add';

export default class TagCommandsAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t commands add'],
      label: 'tag',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Add a tag into the custom command list',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
        ],
        id: Formatter.Commands.TagCommandsAdd.COMMAND_ID,
        usage: '<tagname>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: 1,
      type: Parameters.NotSoTag,
    });
  }

  async onBefore(context: Command.Context) {
    if (context.user.isClientOwner) {
      return true;
    }

    if (context.inDm) {
      const user = await UserStore.getOrFetch(context, context.userId);
      if (!user || (!user.premiumType && !user.hasFlag(UserFlags.OWNER))) {
        context.metadata = context.metadata || {};
        context.metadata.content = 'You must have NotSoPremium to have custom commands!';
        return false;
      }
    } else if (context.guildId) {
      const guildId = context.guildId!;
      const settings = await GuildSettingsStore.getOrFetch(context, guildId);
      if (settings && settings.features.has(GuildFeatures.FREE_CUSTOM_COMMANDS)) {
        return true;
      }

      const guild = context.guild!;
      if (guild) {
        // get owner
        const owner = await UserStore.getOrFetch(context, guild.ownerId);
        if (!owner || (!owner.hasFlag(UserFlags.OWNER) && !owner.hasFlag(UserFlags.PREMIUM_DISCORD))) {
          context.metadata = context.metadata || {};
          context.metadata.content = 'The server owner must have NotSoPremium to have custom commands here!';
          return false;
        }
      }
    }

    return true;
  }

  onCancel(context: Command.Context) {
    if (context.metadata && context.metadata.content) {
      return editOrReply(context, context.metadata.content);
    }
    return super.onCancel(context);
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagCommandsAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagCommandsAdd.CommandArgsBefore) {
    if (args.tag === false) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCommandsAdd.CommandArgs) {
    return Formatter.Commands.TagCommandsAdd.createMessage(context, args);
  }
}

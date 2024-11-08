import { Command, CommandClient } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import UserStore from '../../../stores/users';

import { CommandCategories, GuildFeatures, TagGenerationModels, UserFlags } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ai';

export default class AiCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'debug', type: Boolean},
        {
          name: 'use',
          label: 'model',
          type: Parameters.oneOf({choices: TagGenerationModels}),
        },
      ],
      label: 'prompt',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Use AI to generate and execute TagScript code',
        examples: [
          `${COMMAND_NAME} what is cake\'s user id`,
        ],
        id: Formatter.Commands.TagGenerate.COMMAND_ID,
        usage: '<text> (-debug) (-use TagGenerationModels)',
      },
      priority: -1,
      type: Parameters.targetText,
    });
  }

  async onBefore(context: Command.Context) {
    let hasPremium: boolean = false;

    const user = await UserStore.getOrFetch(context, context.userId);
    if (user && (user.premiumType || user.hasFlag(UserFlags.OWNER))) {
      hasPremium = true;
    }

    if (!hasPremium) {
      if (context.guildId) {
        const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
        if (settings && settings.features.has(GuildFeatures.AI_ACCESS)) {
          hasPremium = true;
        } else {
          const guild = context.guild;
          if (guild) {
            const owner = await UserStore.getOrFetch(context, guild.ownerId);
            if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
              hasPremium = true;
            }
          }
        }
      } else if (context.inDm && context.channel && context.channel.ownerId) {
        // most likely a group dm, check to see if is owner of it
        const owner = await UserStore.getOrFetch(context, context.channel.ownerId);
        if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
          hasPremium = true;
        }
      }
    }

    return hasPremium;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagGenerate.CommandArgs) {
    return !!args.prompt;
  }

  async run(context: Command.Context, args: Formatter.Commands.TagGenerate.CommandArgs) {
    return Formatter.Commands.TagGenerate.createMessage(context, args);
  }
}

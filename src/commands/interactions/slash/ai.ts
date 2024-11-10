import { Interaction } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import GuildSettingsStore from '../../../stores/guildsettings';
import UserStore from '../../../stores/users';

import { CommandCategories, GuildFeatures, UserFlags } from '../../../constants';
import { Formatter, editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export default class AICommand extends BaseSlashCommand {
  description = 'Use NotSoAI to generate and execute TagScript code';
  metadata = {
    id: Formatter.Commands.TagGenerate.COMMAND_ID,
  };
  name = 'ai';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        {
          name: 'prompt',
          description: 'Prompt to ask NotSoAI',
          required: true,
        },
        {
          name: 'debug',
          description: 'Upload the prompt instead of processing',
          type: Boolean,
        },
        {
          name: 'attachment',
          description: 'Media File',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  async onBefore(context: Interaction.InteractionContext) {
    const shouldProceed = await super.onBefore(context);
    if (!shouldProceed) {
      return shouldProceed;
    }

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

    if (!hasPremium) {
      context.metadata = context.metadata || {};
      context.metadata.reason = 'You or the Server Owner must have NotSoPremium to use NotSoAI!';
      context.metadata.reasonIsPremiumRequired = true;
    }
    return hasPremium;
  }

  run(context: Interaction.InteractionContext, args: Formatter.Commands.TagGenerate.CommandArgs) {
    return Formatter.Commands.TagGenerate.createMessage(context, args);
  }
}

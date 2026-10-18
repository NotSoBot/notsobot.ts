import { Interaction } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import GuildSettingsStore from '../../../stores/guildsettings';
import ServerSettingsStore from '../../../stores/serversettings';
import UserStore from '../../../stores/users';

import {
  CommandCategories,
  GuildFeatures,
  TagGenerationModels,
  TagGenerationModelsToTextWithTier,
  TagGenerationPersonalityPreferences,
  TagGenerationPersonalityPreferencesToText,
  UserFlags,
} from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export default class AICommand extends BaseSlashCommand {
  description = 'Use NotSoAI to generate and execute TagScript code';
  descriptionLocalizations = I18n.localizations('commands.ai.description');
  metadata = {
    id: Formatter.Commands.TagGenerate.COMMAND_ID,
    premium: true,
    premiumServer: GuildFeatures.AI_ACCESS,
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
          ...I18n.optionLocalizations('commands.ai.prompt'),
          required: true,
        },
        {
          name: 'model',
          description: 'AI Model',
          ...I18n.optionLocalizations('commands.ai.model'),
          choices: Parameters.Slash.oneOf({choices: TagGenerationModels, descriptions: TagGenerationModelsToTextWithTier}),
        },
        {
          name: 'personalitypreference',
          description: 'Personality Preference',
          ...I18n.optionLocalizations('commands.ai.personalitypreference'),
          label: 'personalityPreference',
          choices: Parameters.Slash.oneOf({
            choices: TagGenerationPersonalityPreferences,
            descriptions: TagGenerationPersonalityPreferencesToText,
            localizationKey: 'choices.tag_generation_personality_preferences',
          }),
        },
        {
          name: 'debug',
          description: 'Upload the prompt instead of processing',
          ...I18n.optionLocalizations('commands.ai.debug'),
          type: Boolean,
        },
        {
          name: 'attachment',
          description: 'Media File',
          ...I18n.optionLocalizations('commands.ai.attachment'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  get fullName(): string {
    return 'NotSoAI';
  }

  async onBefore(context: Interaction.InteractionContext) {
    const shouldProceed = await super.onBefore(context);
    if (!shouldProceed) {
      return shouldProceed;
    }

    let hasPremium: boolean = false;

    const user = await UserStore.getOrFetch(context, context.userId);
    if (user && (user.isPremiumPlusAI || user.hasFlag(UserFlags.OWNER))) {
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
            if (owner && (owner.isPremiumPlusAI || owner.hasFlag(UserFlags.OWNER))) {
              hasPremium = true;
            }
          }
        }
      } else if (context.inDm && context.channel && context.channel.ownerId) {
        // most likely a group dm, check to see if is owner of it
        const owner = await UserStore.getOrFetch(context, context.channel.ownerId);
        if (owner && (owner.isPremiumPlusAI || owner.hasFlag(UserFlags.OWNER))) {
          hasPremium = true;
        }
        if (!hasPremium) {
          const serverId = context.channelId!;
          const settings = await ServerSettingsStore.getOrFetch(context, serverId);
          if (settings && settings.features.has(GuildFeatures.AI_ACCESS)) {
            hasPremium = true;
          }
        }
      }
    }

    if (!hasPremium) {
      context.metadata = context.metadata || {};
      const { translate } = await I18n.getTranslator(context);
      context.metadata.reason = translate('errors.premium_ai_required');
      context.metadata.reasonIsPremiumRequired = true;
    }

    return hasPremium;
  }

  run(context: Interaction.InteractionContext, args: Formatter.Commands.TagGenerate.CommandArgs) {
    return Formatter.Commands.TagGenerate.createMessage(context, args);
  }
}

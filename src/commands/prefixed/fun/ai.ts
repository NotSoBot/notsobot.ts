import { Command, CommandClient } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getServerPremiumUsers } from '../../../stores/premiumservers';
import UserStore from '../../../stores/users';

import {
  CommandCategories,
  GuildFeatures,
  TagGenerationModels,
  TagGenerationModelsToText,
  TagGenerationPersonalityPreferences,
  TagGenerationPersonalityPreferencesToText,
  UserFlags,
} from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { warning } from '../../errors';
import { BaseCommand, CommandMetadata } from '../basecommand';


export const COMMAND_NAME = 'ai';

export default class AiCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'debug', type: Boolean},
        {name: 'debug2', aliases: ['d2'], label: 'debugFull', type: Boolean},
        {
          name: 'personalitypreference',
          aliases: ['pp'],
          label: 'personalityPreference',
          type: Parameters.oneOf({choices: TagGenerationPersonalityPreferences, descriptions: TagGenerationPersonalityPreferencesToText}),
        },
        {
          name: 'use',
          label: 'model',
          type: Parameters.oneOf({choices: TagGenerationModels, descriptions: TagGenerationModelsToText}),
        },
      ],
      label: 'prompt',
      metadata: {
        category: CommandCategories.AI,
        pipeable: false,
        description: 'Use AI to generate and execute TagScript code',
        examples: [
          `${COMMAND_NAME} what is cake\'s user id`,
        ],
        id: Formatter.Commands.TagGenerate.COMMAND_ID,
        usage: '<text> (-debug) (-personalitypreference <choice>) (-use <choice>)',
      },
      priority: -1,
      type: Parameters.targetText,
    });
  }

  // replace get commandDescription():

  async onBefore(context: Command.Context) {
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
        }
      }

      if (!hasPremium) {
        // someone in here gave it one of their premium server slots (or owns it, for a group dm) and has plus ai
        const users = await getServerPremiumUsers(context);
        hasPremium = users.some((x) => x.isPremiumPlusAI);
      }
    }

    if (!hasPremium) {
      // without a reason `onCancel` doesn't reply at all, so non-premium users got nothing back
      const { translate } = await I18n.getTranslator(context);
      context.metadata = context.metadata || {};
      context.metadata.reason = warning(translate('errors.premium_ai_required'));
      context.metadata.reasonIsPremiumRequired = true;
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

import { Interaction } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import {
  CommandCategories,
  TagGenerationPersonalityPreferences,
  TagGenerationPersonalityPreferencesToText,
} from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export default class AICommand extends BaseSlashCommand {
  description = 'Use NotSoAI to generate and execute TagScript code';
  descriptionLocalizations = I18n.localizations('commands.ai.description');
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
          ...I18n.optionLocalizations('commands.ai.prompt'),
          required: true,
        },
        // model picker disabled, the user's `/settings set ai model` (or the api default) is used instead
        // {
        //   name: 'model',
        //   description: 'AI Model',
        //   ...I18n.optionLocalizations('commands.ai.model'),
        //   choices: Parameters.Slash.oneOf({choices: TagGenerationModels, descriptions: TagGenerationModelsToTextWithTier}),
        // },
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
          name: 'url',
          description: 'Emoji/Media URL/User',
          ...I18n.optionLocalizations('commands.options.media.url'),
          value: Parameters.url,
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

  // no premium check here: the api lets in Plus (weekly credits), anyone with NotSoCredits, Max servers and
  // `AI_ACCESS`, and its PREMIUM_REQUIRED (`credits: true`, max tier) says what's missing
  run(context: Interaction.InteractionContext, args: Formatter.Commands.TagGenerate.CommandArgs) {
    return Formatter.Commands.TagGenerate.createMessage(context, args);
  }
}

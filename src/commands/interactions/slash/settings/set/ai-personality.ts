import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetAIPersonalityCommand extends BaseInteractionCommandOption {
  description = 'Set your default AI Personality.';
  descriptionLocalizations = I18n.localizations('commands.settings.set.ai_personality.description');
  metadata = {
    id: Formatter.Commands.SettingsSetAIPersonality.COMMAND_ID,
  };
  name = 'ai-personality';
  nameLocalizations = I18n.localizations('commands.settings.set.ai_personality.name');

  constructor() {
    super({
      options: [
        {
          name: 'personality',
          description: 'AI Personality',
          ...I18n.optionLocalizations('commands.settings.set.ai_personality.personality'),
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.ai_personality.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetAIPersonality.CommandArgs) {
    return Formatter.Commands.SettingsSetAIPersonality.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetAIPersonalityCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set the server\'s default AI personality';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_ai_personality.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetAIPersonality.COMMAND_ID,
  };
  name = 'ai-personality';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_ai_personality.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'personality',
          description: 'AI Personality',
          ...I18n.optionLocalizations('commands.settings_server.set.set_ai_personality.personality'),
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_ai_personality.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetAIPersonality.CommandArgs) {
    return Formatter.Commands.SettingsServerSetAIPersonality.createMessage(context, args);
  }
}

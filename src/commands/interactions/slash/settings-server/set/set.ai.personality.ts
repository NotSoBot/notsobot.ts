import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class SettingsServerSetAIPersonalityCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set the server\'s default AI personality for the bot.';
  metadata = {
    id: Formatter.Commands.SettingsServerSetAIPersonality.COMMAND_ID,
  };
  name = 'ai-personality';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'personality',
          description: 'AI Personality',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetAIPersonality.CommandArgs) {
    return Formatter.Commands.SettingsServerSetAIPersonality.createMessage(context, args);
  }
}

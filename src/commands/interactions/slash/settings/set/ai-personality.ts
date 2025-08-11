import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetAIPersonalityCommand extends BaseInteractionCommandOption {
  description = 'Set your default AI Personality.';
  metadata = {
    id: Formatter.Commands.SettingsSetAIPersonality.COMMAND_ID,
  };
  name = 'ai-personality';

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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetAIPersonality.CommandArgs) {
    return Formatter.Commands.SettingsSetAIPersonality.createMessage(context, args);
  }
}

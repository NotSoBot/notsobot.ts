import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsAIMemoryForgetCommand extends BaseInteractionCommandOption {
  description = 'Make NotSoAI forget one thing it remembers about you';
  descriptionLocalizations = I18n.localizations('commands.settings.ai_memory.forget.description');
  metadata = {
    id: Formatter.Commands.SettingsAIMemoryForget.COMMAND_ID,
  };
  name = 'forget';
  nameLocalizations = I18n.localizations('commands.settings.ai_memory.forget.name');
  // what NotSoAI remembers about someone is theirs, so the loading state is private too
  triggerLoadingAsEphemeral = true;

  constructor() {
    super({
      options: [
        {
          name: 'position',
          description: 'The memory\'s number from the list',
          ...I18n.optionLocalizations('commands.settings.ai_memory.forget.position'),
          required: true,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsAIMemoryForget.CommandArgs) {
    return Formatter.Commands.SettingsAIMemoryForget.createMessage(context, args);
  }
}

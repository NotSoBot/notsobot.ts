import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetAIMemoryCommand extends BaseInteractionCommandOption {
  description = 'Turn NotSoAI\'s memory of you on or off';
  descriptionLocalizations = I18n.localizations('commands.settings.set.ai_memory.description');
  metadata = {
    id: Formatter.Commands.SettingsSetAIMemory.COMMAND_ID,
  };
  name = 'ai-memory';
  nameLocalizations = I18n.localizations('commands.settings.set.ai_memory.name');

  constructor() {
    super({
      options: [
        {
          name: 'enabled',
          description: 'Let NotSoAI remember things you ask it to',
          ...I18n.optionLocalizations('commands.settings.set.ai_memory.enabled'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetAIMemory.CommandArgs) {
    return Formatter.Commands.SettingsSetAIMemory.createMessage(context, args);
  }
}

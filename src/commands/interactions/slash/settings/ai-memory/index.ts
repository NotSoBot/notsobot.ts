import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsAIMemoryClearCommand } from './clear';
import { SettingsAIMemoryForgetCommand } from './forget';
import { SettingsAIMemoryListCommand } from './list';


export class SettingsAIMemoryGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'ai-memory';
  nameLocalizations = I18n.localizations('commands.settings.ai_memory.name');

  constructor() {
    super({
      options: [
        new SettingsAIMemoryClearCommand(),
        new SettingsAIMemoryForgetCommand(),
        new SettingsAIMemoryListCommand(),
      ],
    });
  }
}

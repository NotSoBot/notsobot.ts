import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsAIMemoryListCommand extends BaseInteractionCommandOption {
  description = 'See what NotSoAI remembers about you';
  descriptionLocalizations = I18n.localizations('commands.settings.ai_memory.list.description');
  metadata = {
    id: Formatter.Commands.SettingsAIMemoryList.COMMAND_ID,
  };
  name = 'list';
  nameLocalizations = I18n.localizations('commands.settings.ai_memory.list.name');
  // what NotSoAI remembers about someone is theirs, so the loading state is private too
  triggerLoadingAsEphemeral = true;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsAIMemoryList.CommandArgs) {
    return Formatter.Commands.SettingsAIMemoryList.createMessage(context, args);
  }
}

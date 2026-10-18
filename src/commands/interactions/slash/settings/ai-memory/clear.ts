import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsAIMemoryClearCommand extends BaseInteractionCommandOption {
  description = 'Make NotSoAI forget everything it remembers about you';
  descriptionLocalizations = I18n.localizations('commands.settings.ai_memory.clear.description');
  metadata = {
    id: Formatter.Commands.SettingsAIMemoryClear.COMMAND_ID,
  };
  name = 'clear';
  nameLocalizations = I18n.localizations('commands.settings.ai_memory.clear.name');
  // what NotSoAI remembers about someone is theirs, so the loading state is private too
  triggerLoadingAsEphemeral = true;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsAIMemoryClear.CommandArgs) {
    return Formatter.Commands.SettingsAIMemoryClear.createMessage(context, args);
  }
}

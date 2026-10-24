import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceRenameCommand extends BaseInteractionCommandOption {
  description = 'Rename one of your cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceRename.COMMAND_ID,
    premiumPlus: true,
  };
  name = 'rename';

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'Your cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.clonedVoices},
        {name: 'name', description: 'Its new name', required: true, maxLength: 128},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceRename.CommandArgs) {
    return Formatter.Commands.VoiceRename.createMessage(context, args);
  }
}

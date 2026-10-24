import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceDeleteCommand extends BaseInteractionCommandOption {
  description = 'Delete one of your cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceDelete.COMMAND_ID,
    premiumPlus: true,
  };
  name = 'delete';

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'Your cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.clonedVoices},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return Formatter.Commands.VoiceDelete.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceServerDeleteCommand extends BaseInteractionCommandOption {
  description = 'Delete one of the server\'s cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceServer.COMMAND_ID_DELETE,
  };
  name = 'delete';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'The server\'s cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.serverVoices},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return Formatter.Commands.VoiceDelete.createMessage(context, {...args, server: true});
  }
}

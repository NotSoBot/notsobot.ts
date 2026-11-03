import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceServerRenameCommand extends BaseInteractionCommandOption {
  description = 'Rename one of the server\'s cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceServer.COMMAND_ID_RENAME,
  };
  name = 'rename';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'The server\'s cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.serverVoices},
        {name: 'name', description: 'Its new name', required: true, maxLength: 128},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceRename.CommandArgs) {
    return Formatter.Commands.VoiceRename.createMessage(context, {...args, server: true});
  }
}

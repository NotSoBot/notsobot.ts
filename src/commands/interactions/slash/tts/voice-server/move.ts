import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceServerMoveCommand extends BaseInteractionCommandOption {
  description = 'Move one of the server\'s cloned voices between ZONOS3 and fish.audio';
  metadata = {
    id: Formatter.Commands.VoiceServer.COMMAND_ID_MOVE,
  };
  name = 'move';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'The server\'s cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.serverVoices},
        {name: 'platform', description: 'Where it goes, the other one by default', choices: Formatter.Commands.VoiceList.VOICE_CLONE_PLATFORM_CHOICES},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceMove.CommandArgs) {
    return Formatter.Commands.VoiceMove.createMessage(context, {...args, server: true});
  }
}

import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceServerListCommand extends BaseInteractionCommandOption {
  description = 'List the server\'s cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceServer.COMMAND_ID_LIST,
  };
  name = 'list';

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceList.CommandArgs) {
    return Formatter.Commands.VoiceList.createMessage(context, {...args, server: true});
  }
}

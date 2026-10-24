import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceListCommand extends BaseInteractionCommandOption {
  description = 'List your cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceList.COMMAND_ID,
    premiumPlus: true,
  };
  name = 'list';

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceList.CommandArgs) {
    return Formatter.Commands.VoiceList.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'transcribe';

export class ToolsTranscribeCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Transcribe an Audio or Video File';
  metadata = {
    id: Formatter.Commands.ToolsTranscribe.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsTranscribe.CommandArgs) {
    return Formatter.Commands.ToolsTranscribe.createMessage(context, args);
  }
}

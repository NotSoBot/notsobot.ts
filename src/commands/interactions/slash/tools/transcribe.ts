import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'transcribe';

export class ToolsTranscribeCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Transcribe an Audio or Video File';
  descriptionLocalizations = I18n.localizations('commands.tools.transcribe.description');
  metadata = {
    id: Formatter.Commands.ToolsTranscribe.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.transcribe.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsTranscribe.CommandArgs) {
    return Formatter.Commands.ToolsTranscribe.createMessage(context, args);
  }
}

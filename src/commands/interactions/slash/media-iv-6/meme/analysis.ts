import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'analysis';

export class MediaIVMemeAnalysisCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach a "Kowalski, analysis" panel under an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.analysis.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsAnalysis.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.analysis.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsAnalysis.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsAnalysis.createMessage(context, args);
  }
}

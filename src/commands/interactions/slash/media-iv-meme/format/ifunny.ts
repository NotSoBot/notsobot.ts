import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ifunny';

export class MediaIVLabelsIFunnyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add an iFunny watermark to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.labels.ifunny.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsIFunny.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsIFunny.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsIFunny.createMessage(context, args);
  }
}

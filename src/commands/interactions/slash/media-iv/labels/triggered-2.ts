import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'triggered-2';

export class MediaIVLabelsTriggered2Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Resize an Image or Video to 256px wide and attach a Triggered Label';
  descriptionLocalizations = I18n.localizations('commands.media_iv.labels.triggered_2.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsTriggered2.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsTriggered2.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsTriggered2.createMessage(context, args);
  }
}

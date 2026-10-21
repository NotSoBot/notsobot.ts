import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'perfection';

export class MediaIVMemePerfectionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach a "perfection" dictionary definition above an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.perfection.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsPerfection.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.perfection.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsPerfection.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsPerfection.createMessage(context, args);
  }
}

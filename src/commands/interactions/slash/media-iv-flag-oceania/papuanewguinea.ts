import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'papuanewguinea';

export class MediaIVFlagPapuaNewGuineaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Papua New Guinean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.papuanewguinea.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPapuaNewGuinea.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.papuanewguinea.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPapuaNewGuinea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPapuaNewGuinea.createMessage(context, args);
  }
}

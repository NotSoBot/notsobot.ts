import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseOwnerCommandOption } from '../owner/base';


// owner only while it's tested, `BaseInteractionCommandOption` (and in `/game` instead of `/owner game`) once it's public
export class GameImagineCommand extends BaseOwnerCommandOption {
  description = 'Recreate a secret AI image with your own prompt, then vote on who came closest';
  descriptionLocalizations = I18n.localizations('commands.game.imagine.description');
  metadata = {
    id: Formatter.Commands.GameImagine.COMMAND_ID,
  };
  name = 'imagine';
  nameLocalizations = I18n.localizations('commands.game.imagine.name');
  // everyone in the channel has to see the lobby to join it
  ignoresEphemeralSetting = true;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.GameImagine.CommandArgs) {
    return Formatter.Commands.GameImagine.createMessage(context, args);
  }
}

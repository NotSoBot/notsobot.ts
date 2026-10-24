import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseOwnerCommandOption } from '../../owner/base';


// owner only while it's tested, `BaseInteractionCommandOption` (and in `/fun` instead of `/owner`) once it's public
export class FunGameImagineCommand extends BaseOwnerCommandOption {
  description = 'Recreate a secret AI image with your own prompt, then vote on who came closest';
  descriptionLocalizations = I18n.localizations('commands.fun.game.imagine.description');
  metadata = {
    id: Formatter.Commands.FunGameImagine.COMMAND_ID,
  };
  name = 'imagine';
  nameLocalizations = I18n.localizations('commands.fun.game.imagine.name');
  // everyone in the channel has to see the lobby to join it
  ignoresEphemeralSetting = true;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunGameImagine.CommandArgs) {
    return Formatter.Commands.FunGameImagine.createMessage(context, args);
  }
}

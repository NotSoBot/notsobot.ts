import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'badmeme';

export class BadMemeCommand extends BaseInteractionCommandOption {
  description = 'Show a Bad Meme';
  descriptionLocalizations = I18n.localizations('commands.fun.badmeme.description');
  metadata = {
    id: Formatter.Commands.FunBadMeme.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.badmeme.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunBadMeme.CommandArgs) {
    return Formatter.Commands.FunBadMeme.createMessage(context, args);
  }
}

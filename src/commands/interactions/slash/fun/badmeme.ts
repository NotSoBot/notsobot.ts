import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'badmeme';

export class BadMemeCommand extends BaseInteractionCommandOption {
  description = 'Show a Bad Meme';
  metadata = {
    id: Formatter.Commands.FunBadMeme.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunBadMeme.CommandArgs) {
    return Formatter.Commands.FunBadMeme.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'concat';

export class MediaAIVConcatCommand extends BaseInteractionMediasCommandOption {
  description = 'Play two Audio/Image/Video files one after the other';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.concat.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationConcat.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.concat.name');

  constructor() {
    super({minAmount: 2});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationConcat.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConcat.createMessage(context, args);
  }
}

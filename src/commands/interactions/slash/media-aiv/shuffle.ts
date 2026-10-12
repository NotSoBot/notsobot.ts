import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'shuffle';

export class MediaAIVShuffleCommand extends BaseInteractionMediaCommandOption {
  description = 'Shuffle an Audio/Image/Video file\'s frames around randomly';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.shuffle.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationShuffle.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.shuffle.name');

  constructor() {
    super({
      options: [
        {name: 'segment', description: 'Each Segment Duration (Default: 0.5)', ...I18n.optionLocalizations('commands.media_aiv.shuffle.segment'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationShuffle.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationShuffle.createMessage(context, args);
  }
}

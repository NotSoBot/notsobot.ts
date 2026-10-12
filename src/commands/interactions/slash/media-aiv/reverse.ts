import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reverse';

export class MediaAIVReverseCommand extends BaseInteractionMediaCommandOption {
  description = 'Reverse an Animated Image/Audio/Video';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.reverse.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationReverse.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.reverse.name');

  constructor() {
    super({
      options: [
        {name: 'noaudio', description: 'Do not reverse audio', ...I18n.optionLocalizations('commands.media_aiv.reverse.noaudio'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationReverse.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationReverse.createMessage(context, args);
  }
}

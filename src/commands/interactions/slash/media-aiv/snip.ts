import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'snip';

export class MediaAIVSnipCommand extends BaseInteractionMediaCommandOption {
  description = 'Cut out the part of an Animated Image/Audio/Video between two times';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.snip.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationSnip.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.snip.name');

  constructor() {
    super({
      options: [
        {name: 'start', description: 'Timestamp to start at', ...I18n.optionLocalizations('commands.media_aiv.snip.start'), default: 0, value: Parameters.secondsWithOptions({negatives: true})},
        {name: 'end', description: 'Timestamp to end at', ...I18n.optionLocalizations('commands.media_aiv.snip.end'), default: 0, value: Parameters.secondsWithOptions({negatives: true})},
        {name: 'audio', description: 'Audio Only', ...I18n.optionLocalizations('commands.media_aiv.snip.audio'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationSnip.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSnip.createMessage(context, args);
  }
}

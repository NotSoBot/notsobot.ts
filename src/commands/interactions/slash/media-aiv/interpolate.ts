import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'interpolate';

export class MediaAIVInterpolateCommand extends BaseInteractionMediasCommandOption {
  description = 'Cut two Audio/Image/Video files into small pieces and alternate between them';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.interpolate.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationInterpolate.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.interpolate.name');

  constructor() {
    super({
      options: [
        {name: 'noloop', description: 'Do not loop the shortest media to match the longest media', ...I18n.optionLocalizations('commands.media_aiv.interpolate.noloop'), type: Boolean},
        {name: 'segment', description: 'Each Piece\'s Duration in Seconds (Default: 0.125)', ...I18n.optionLocalizations('commands.media_aiv.interpolate.segment'), type: 'number'},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationInterpolate.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationInterpolate.createMessage(context, args);
  }
}

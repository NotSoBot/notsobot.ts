import { Interaction } from 'detritus-client';

import { MediaFaceXmasCapColors } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


const DEFAULT_COLOR = Formatter.Commands.MediaIVManipulationFaceXmasCap.DEFAULT_COLOR;

export const COMMAND_NAME = 'xmas-cap';

export class MediaIVXmasCapCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put a Santa hat on every face in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.xmas_cap.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceXmasCap.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.xmas_cap.name');

  constructor() {
    super({
      options: [
        {
          name: 'color',
          description: `Color (Default: ${DEFAULT_COLOR})`,
          ...I18n.optionLocalizations('commands.media_iv_5.face.xmas_cap.color'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceXmasCapColors, defaultChoice: DEFAULT_COLOR}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceXmasCap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceXmasCap.createMessage(context, args);
  }
}

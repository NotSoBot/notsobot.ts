import { Interaction } from 'detritus-client';

import { MediaFaceForeheadSizes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { FACE_OPTION } from './options';


const DEFAULT_SIZE = Formatter.Commands.MediaIVManipulationFaceForehead.DEFAULT_SIZE;

export const COMMAND_NAME = 'forehead';

export class MediaIVForeheadCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Give an Image or Video\'s face a bigger forehead';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.forehead.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceForehead.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.forehead.name');

  constructor() {
    super({
      options: [
        {
          name: 'size',
          description: `Size (Default: ${DEFAULT_SIZE})`,
          ...I18n.optionLocalizations('commands.media_iv_5.face.forehead.size'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceForeheadSizes, defaultChoice: DEFAULT_SIZE}),
        },
        FACE_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceForehead.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceForehead.createMessage(context, args);
  }
}

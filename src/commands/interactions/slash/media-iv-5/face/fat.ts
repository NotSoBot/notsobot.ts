import { Interaction } from 'detritus-client';

import { MediaFaceFatSizes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


const DEFAULT_SIZE = Formatter.Commands.MediaIVManipulationFaceFat.DEFAULT_SIZE;

export const COMMAND_NAME = 'fat';

export class MediaIVFatCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Fattify an Image or Video\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.fat.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceFat.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.fat.name');

  constructor() {
    super({
      options: [
        {
          name: 'size',
          description: `Size (Default: ${DEFAULT_SIZE})`,
          ...I18n.optionLocalizations('commands.media_iv_5.face.fat.size'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceFatSizes, defaultChoice: DEFAULT_SIZE}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceFat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceFat.createMessage(context, args);
  }
}

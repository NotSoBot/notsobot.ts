import { Interaction } from 'detritus-client';

import { MediaFaceFatSizes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


const DEFAULT_SIZE = Formatter.Commands.MediaIManipulationFaceFat.DEFAULT_SIZE;

export const COMMAND_NAME = 'fat';

export class MediaIFatCommand extends BaseInteractionImageCommandOption {
  description = 'Fattify an Image\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_i.face.fat.description');
  metadata = {
    id: Formatter.Commands.MediaIManipulationFaceFat.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.face.fat.name');

  constructor() {
    super({
      options: [
        {
          name: 'size',
          description: `Size (Default: ${DEFAULT_SIZE})`,
          ...I18n.optionLocalizations('commands.media_i.face.fat.size'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceFatSizes, defaultChoice: DEFAULT_SIZE}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationFaceFat.CommandArgs) {
    return Formatter.Commands.MediaIManipulationFaceFat.createMessage(context, args);
  }
}

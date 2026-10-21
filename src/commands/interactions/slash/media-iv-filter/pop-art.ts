import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pop-art';

export class MediaIVPopArtCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into a 2x2 Warhol style pop art grid';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.pop_art.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPopArt.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.pop_art.name');

  constructor() {
    super({
      options: [
        {
          name: 'grid',
          description: 'Grid Size (Default: 2x2)',
          ...I18n.optionLocalizations('commands.media_iv_5.fun.pop_art.grid'),
          type: ApplicationCommandOptionTypes.INTEGER,
          choices: [{name: '2x2', value: 2}, {name: '3x3', value: 3}],
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPopArt.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPopArt.createMessage(context, args);
  }
}

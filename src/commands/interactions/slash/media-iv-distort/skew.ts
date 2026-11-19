import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'skew';

export class MediaIVSkewCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Slant an image or video sideways (or up and down)';
  descriptionLocalizations = I18n.localizations('commands.media_iv_distort.skew.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSkew.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_distort.skew.name');

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: 'Degrees, -80 to 80 (Default: 30)',
          ...I18n.optionLocalizations('commands.media_iv_distort.skew.amount'),
          maxValue: 80,
          minValue: -80,
          type: 'number',
        },
        {
          name: 'vertical',
          description: 'Slant it up and down instead',
          ...I18n.optionLocalizations('commands.media_iv_distort.skew.vertical'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSkew.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSkew.createMessage(context, args);
  }
}

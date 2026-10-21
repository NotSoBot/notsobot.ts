import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'gradient-map';

export class MediaIVGradientMapCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Recolor an Image or Video by brightness along a gradient, like VEGAS\' Gradient Map';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.gradient_map.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGradientMap.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.gradient_map.name');

  constructor() {
    super({
      options: [
        {
          name: 'colors',
          description: 'Darkest to brightest, each COLOR or COLOR,POSITION (ex: "#000080 #ff8000,0.7 white")',
          ...I18n.optionLocalizations('commands.media_iv_5.fun.gradient_map.colors'),
          label: 'stops',
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGradientMap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGradientMap.createMessage(context, args);
  }
}

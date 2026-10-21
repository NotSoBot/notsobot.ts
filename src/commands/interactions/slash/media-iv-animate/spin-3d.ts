import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'spin-3d';

export class MediaIVSpin3dCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Spin an Image or Video in 3d space, like the dancing cockroach';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.spin_3d.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSpin3d.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.spin_3d.name');

  constructor() {
    super({
      options: [
        {name: 'clockwise', description: 'Rotate the Media clockwise', ...I18n.optionLocalizations('commands.media_iv_2.fun.spin_3d.clockwise'), type: Boolean},
        {name: 'tilt', description: 'Horizontal Centerline Rotation (-360..360) (Default: 15)', ...I18n.optionLocalizations('commands.media_iv_2.fun.spin_3d.tilt'), type: Number},
        {name: 'zoom', description: 'Zoom Amount (-3.0..3.0) (Default: 1.5)', ...I18n.optionLocalizations('commands.media_iv_2.fun.spin_3d.zoom'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSpin3d.CommandArgs) {
   return Formatter.Commands.MediaIVManipulationSpin3d.createMessage(context, args);
  }
}

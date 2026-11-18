import { Interaction } from 'detritus-client';

import { MediaParallaxMotions } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';
import { FOCUS_OPTIONS } from './options';


const MediaParallaxMotionsNames = {CIRCLE: 'Circle', SWAY: 'Sway', ZOOM: 'Zoom'};


export const COMMAND_NAME = '3d-photo';

export class MediaIVDepthPhoto3dCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make a 3D photo: the camera moves a little around it by its depth';
  descriptionLocalizations = I18n.localizations('commands.media_iv_depth.photo_3d.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDepthParallax.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_depth.photo_3d.name');

  constructor() {
    super({
      options: [
        {
          name: 'motion',
          description: 'How the camera moves (Default: Circle)',
          ...I18n.optionLocalizations('commands.media_iv_depth.photo_3d.motion'),
          choices: Parameters.Slash.oneOf({
            choices: MediaParallaxMotions,
            defaultChoice: MediaParallaxMotions.CIRCLE,
            descriptions: MediaParallaxMotionsNames,
            localizationKey: 'choices.parallax_motions',
          }),
        },
        {
          name: 'amount',
          description: 'How far the nearest things move, a percent of the shorter side, 0.5 to 10 (Default: 3)',
          ...I18n.optionLocalizations('commands.media_iv_depth.photo_3d.amount'),
          maxValue: 10,
          minValue: 0.5,
          type: 'number',
        },
        {
          name: 'duration',
          description: 'Seconds a loop takes, 1 to 10 (Default: 3)',
          ...I18n.optionLocalizations('commands.media_iv_depth.photo_3d.duration'),
          maxValue: 10,
          minValue: 1,
          type: 'number',
        },
        ...FOCUS_OPTIONS,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDepthParallax.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthParallax.createMessage(context, args);
  }
}

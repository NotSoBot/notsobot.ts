import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MediaLUTInterpolations } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { replyWarning } from '../../../../errors';
import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'lut';

export interface CommandArgsBefore {
  cube?: Structures.Attachment | string,
  cubeUrl?: string,
  interpolation?: MediaLUTInterpolations,
  strength?: number,
  url?: null | string,
}

export class MediaIVLUTCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Color grade an Image or Video with a .cube LUT';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.lut.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLUT.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.lut.name');

  constructor() {
    super({
      options: [
        {name: 'cube', description: 'LUT file (.cube)', ...I18n.optionLocalizations('commands.media_iv_5.fun.lut.cube'), type: ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'cube-url', description: 'LUT URL, instead of the file', ...I18n.optionLocalizations('commands.media_iv_5.fun.lut.cube_url'), label: 'cubeUrl'},
        {name: 'strength', description: 'How much of the grade shows over the original (0..1, Default: 1)', ...I18n.optionLocalizations('commands.media_iv_5.fun.lut.strength'), type: Number},
        {
          name: 'interpolation',
          description: 'How colors between the LUT\'s points are worked out (Default: Tetrahedral)',
          ...I18n.optionLocalizations('commands.media_iv_5.fun.lut.interpolation'),
          choices: Parameters.Slash.oneOf({
            choices: MediaLUTInterpolations,
            defaultChoice: MediaLUTInterpolations.TETRAHEDRAL,
          }),
        },
      ],
    }, {skipFiles: ['.cube']});
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (!getCubeUrl(args)) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_cube_found'), {ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return super.onBeforeRun(context, args) && !!getCubeUrl(args);
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.MediaIVManipulationLUT.createMessage(context, {
      cube: getCubeUrl(args)!,
      interpolation: args.interpolation,
      strength: args.strength,
      url: args.url!,
    });
  }
}


function getCubeUrl(args: CommandArgsBefore): null | string {
  // the option comes back as the resolved attachment
  if (args.cube instanceof Structures.Attachment) {
    return args.cube.url || args.cube.proxyUrl || null;
  }
  return args.cubeUrl || null;
}

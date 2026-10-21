import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'hue-curve-rgba';

export class MediaIVHueCurveRGBACommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply RGB/A curve adjustments to an Image or Video\'s channels';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.hue_curve_rgba.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationHueCurveRGBA.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.hue_curve_rgba.name');

  constructor() {
    super({
      options: [
        {name: 'all', description: 'Curve for all channels (ex: "0,0 0.5,0.7 1,1")', ...I18n.optionLocalizations('commands.media_iv_3.fun.hue_curve_rgba.all'), value: Parameters.hueCurveCoordinates},
        {name: 'red', description: 'Red channel curve (ex: "0,1 1,1")', ...I18n.optionLocalizations('commands.media_iv_3.fun.hue_curve_rgba.red'), value: Parameters.hueCurveCoordinates},
        {name: 'green', description: 'Green channel curve', ...I18n.optionLocalizations('commands.media_iv_3.fun.hue_curve_rgba.green'), value: Parameters.hueCurveCoordinates},
        {name: 'blue', description: 'Blue channel curve', ...I18n.optionLocalizations('commands.media_iv_3.fun.hue_curve_rgba.blue'), value: Parameters.hueCurveCoordinates},
        {name: 'alpha', description: 'Alpha channel curve', ...I18n.optionLocalizations('commands.media_iv_3.fun.hue_curve_rgba.alpha'), value: Parameters.hueCurveCoordinates},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueCurveRGBA.CommandArgs) {
    if (!super.onBeforeRun(context, args)) {
      return false;
    }
    return !!(args.all || args.red || args.green || args.blue || args.alpha);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueCurveRGBA.CommandArgs) {
    if (!args.url) {
      return super.onCancelRun(context, args);
    }
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.no_hue_curves')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueCurveRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueCurveRGBA.createMessage(context, args);
  }
}

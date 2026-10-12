import { Interaction } from 'detritus-client';

import { MediaResizeKernels } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'resize';

export class MediaIVToolsResizeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Resize an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.resize.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationResize.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.resize.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Resize Scale (Default: 2.0)', ...I18n.optionLocalizations('commands.media_iv_tools.resize.scale'), default: 2, type: 'number'},
        {
          name: 'kernel',
          description: 'Resampling filter used for scaling',
          ...I18n.optionLocalizations('commands.media_iv_tools.resize.kernel'),
          choices: Parameters.Slash.oneOf({choices: MediaResizeKernels}),
        },
        {name: 'ratio', description: 'Keep the Image\'s Ratio the same', ...I18n.optionLocalizations('commands.media_iv_tools.resize.ratio'), type: Boolean},
        {name: 'size', description: 'number or (width)x(height)', ...I18n.optionLocalizations('commands.media_iv_tools.resize.size')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationResize.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationResize.createMessage(context, args);
  }
}

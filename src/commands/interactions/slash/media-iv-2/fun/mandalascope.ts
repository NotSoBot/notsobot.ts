import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mandalascope';

export class MediaIVMandalaScopeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Mandala-like Kaleidoscope filter to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.mandalascope.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMandalaScope.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Segment Amount (3..16) (Default: 12)', ...I18n.optionLocalizations('commands.media_iv_2.fun.mandalascope.amount'), type: Number},
        {name: 'rotation', description: 'Rotation Degrees (0..360) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.mandalascope.rotation'), type: Number},
        {name: 'scale', description: 'Scale Factor (0.01..10) (Default: 1.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.mandalascope.scale'), type: 'number'},
        {name: 'translation', description: 'Translation Percentage (0..200) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.mandalascope.translation'), type: Number},
        {name: 'zoom', description: 'Zoom Factor Degrees (0.01..10) (Default: 1.4)', ...I18n.optionLocalizations('commands.media_iv_2.fun.mandalascope.zoom'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMandalaScope.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMandalaScope.createMessage(context, args);
  }
}

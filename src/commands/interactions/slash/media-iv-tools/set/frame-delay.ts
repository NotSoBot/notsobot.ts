import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'frame-delay';

export class MediaIVToolsSetFrameDelayCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Set how long every frame of an animated image or video is shown';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.set.frame_delay.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSetFrameDelay.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.set.frame_delay.name');

  constructor() {
    super({
      options: [
        {
          name: 'delay',
          description: 'Milliseconds a frame, 10 to 60000',
          ...I18n.optionLocalizations('commands.media_iv_tools.set.frame_delay.delay'),
          maxValue: 60000,
          minValue: 10,
          required: true,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSetFrameDelay.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSetFrameDelay.createMessage(context, args);
  }
}

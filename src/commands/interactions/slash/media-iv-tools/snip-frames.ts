import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'snip-frames';

export class MediaIVToolsSnipFramesCommand extends BaseInteractionMediaCommandOption {
  description = 'Snip the frames of an Animated Image/Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.snip_frames.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSnipFrames.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.snip_frames.name');

  constructor() {
    super({
      options: [
        {name: 'start', description: 'Frames to start at', ...I18n.optionLocalizations('commands.media_iv_tools.snip_frames.start'), default: 0, type: Number},
        {name: 'end', description: 'Frames to end at', ...I18n.optionLocalizations('commands.media_iv_tools.snip_frames.end'), default: 0, type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSnipFrames.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSnipFrames.createMessage(context, args);
  }
}

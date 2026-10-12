import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bitrate';

export class MediaAVToolsSetBitRateCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Set an Audio or Video File\'s Bit Rate';
  descriptionLocalizations = I18n.localizations('commands.media_av_tools.set.bitrate.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationSetBitRate.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av_tools.set.bitrate.name');

  constructor() {
    super({
      options: [
        {
          name: 'audio',
          description: 'Audio Bit Rate',
          ...I18n.optionLocalizations('commands.media_av_tools.set.bitrate.audio'),
          type: Number,
        },
        {
          name: 'video',
          description: 'Video Bit Rate',
          ...I18n.optionLocalizations('commands.media_av_tools.set.bitrate.video'),
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationSetBitRate.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationSetBitRate.createMessage(context, args);
  }
}

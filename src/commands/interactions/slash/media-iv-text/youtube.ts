import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'youtube';

export class MediaIVYouTubeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into a YouTube video with a title';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.youtube.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayYouTube.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.youtube.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Video title',
          ...I18n.optionLocalizations('commands.media_iv_text.youtube.text'),
          maxLength: 100,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'channel',
          description: 'Channel name (Default: your name)',
          ...I18n.optionLocalizations('commands.media_iv_text.youtube.channel'),
          maxLength: 50,
          value: Parameters.parsedMentionsText,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayYouTube.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayYouTube.createMessage(context, args);
  }
}

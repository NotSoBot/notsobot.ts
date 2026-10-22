import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'subtitle';

export class MediaIVSubtitleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add movie subtitles to the bottom of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.subtitle.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlaySubtitle.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.subtitle.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Subtitle text',
          ...I18n.optionLocalizations('commands.media_iv_text.subtitle.text'),
          maxLength: 200,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'yellow',
          description: 'Yellow DVD style subtitles instead of white',
          ...I18n.optionLocalizations('commands.media_iv_text.subtitle.yellow'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlaySubtitle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlaySubtitle.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'tiktok';

export class MediaIVTikTokCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add TikTok text (every line in a rounded box) to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.tiktok.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayTikTok.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.tiktok.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text, every line gets its own box',
          ...I18n.optionLocalizations('commands.media_iv_text.tiktok.text'),
          maxLength: 200,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'position',
          description: 'Where the text goes, 0 is the top and 100 the bottom (Default: 50)',
          ...I18n.optionLocalizations('commands.media_iv_text.tiktok.position'),
          maxValue: 100,
          minValue: 0,
          type: ApplicationCommandOptionTypes.NUMBER,
        },
        {
          name: 'dark',
          description: 'Black boxes with white text instead of white boxes with black text',
          ...I18n.optionLocalizations('commands.media_iv_text.tiktok.dark'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayTikTok.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayTikTok.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'snapchat';

export class MediaIVSnapchatCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add a Snapchat caption (text on a see-through black bar) to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.snapchat.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlaySnapchat.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.snapchat.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Caption text',
          ...I18n.optionLocalizations('commands.media_iv_text.snapchat.text'),
          maxLength: 200,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'position',
          description: 'Where the bar goes, 0 is the top and 100 the bottom (Default: 50)',
          ...I18n.optionLocalizations('commands.media_iv_text.snapchat.position'),
          maxValue: 100,
          minValue: 0,
          type: ApplicationCommandOptionTypes.NUMBER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlaySnapchat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlaySnapchat.createMessage(context, args);
  }
}

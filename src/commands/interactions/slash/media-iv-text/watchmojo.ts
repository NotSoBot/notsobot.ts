import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'watchmojo';

export class MediaIVWatchMojoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into a WatchMojo video with a title';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.watchmojo.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayWatchMojo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.watchmojo.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Video title',
          ...I18n.optionLocalizations('commands.media_iv_text.watchmojo.text'),
          maxLength: 100,
          required: true,
          value: Parameters.parsedMentionsText,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayWatchMojo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWatchMojo.createMessage(context, args);
  }
}

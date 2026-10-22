import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'notification';

export class MediaIVNotificationCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add an iPhone notification banner to the top of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.notification.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayNotification.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.notification.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Message',
          ...I18n.optionLocalizations('commands.media_iv_text.notification.text'),
          maxLength: 200,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'title',
          description: 'Who it\'s from (Default: Messages)',
          ...I18n.optionLocalizations('commands.media_iv_text.notification.title'),
          maxLength: 50,
          value: Parameters.parsedMentionsText,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayNotification.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayNotification.createMessage(context, args);
  }
}

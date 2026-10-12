import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, I18n, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderListServerCommand extends BaseInteractionCommandOption {
  description = 'List of Reminders in this Server';
  descriptionLocalizations = I18n.localizations('commands.reminder.list.server.description');
  metadata = {
    id: Formatter.Commands.ReminderListServer.COMMAND_ID,
  };
  name = 'server';
  nameLocalizations = I18n.localizations('commands.reminder.list.server.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to list reminders for',
          ...I18n.optionLocalizations('commands.reminder.list.server.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ReminderListServer.CommandArgs) {
    return Formatter.Commands.ReminderListServer.createMessage(context, args);
  }
}

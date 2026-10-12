import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, I18n, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderListMeCommand extends BaseInteractionCommandOption {
  description = 'List all of your own Reminders';
  descriptionLocalizations = I18n.localizations('commands.reminder.list.me.description');
  metadata = {
    id: Formatter.Commands.ReminderListMe.COMMAND_ID,
  };
  name = 'me';
  nameLocalizations = I18n.localizations('commands.reminder.list.me.name');

  constructor() {
    super({
      options: [
        {
          name: 'global',
          description: 'Show reminders outside of this Server',
          ...I18n.optionLocalizations('commands.reminder.list.me.global'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ReminderListMe.CommandArgs) {
    return Formatter.Commands.ReminderListMe.createMessage(context, {global: args.global});
  }
}

import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { fetchReminderPositional, moveReminderToDms } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import { DisplayPayload, createUserString, displayReply } from '../../../utils';

import { describeReminder } from './reminder.delete.me';


export const COMMAND_ID = 'reminder.delete.server';

export interface CommandArgs {
  position?: number | string,
  user: Structures.Member | Structures.User,
}

// removes the reminder from the server by moving it to the user's dms, it isn't deleted
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { label, translate } = await getTranslator(context);

  // anyone can move their own reminders, someone else's needs manage messages
  if (args.user.id !== context.userId && !context.user.isClientOwner) {
    const { member } = context;
    if (!member || !(member.isOwner || member.canAdministrator || member.can([Permissions.MANAGE_MESSAGES]))) {
      const permissions = Markup.codestring(label('permissions', 'Manage Messages'));
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('reminder_delete_server.needs_permissions_for_others', {permissions})}`});
    }
  }

  if (args.position === undefined || args.position === null || args.position === '' || Number.isNaN(args.position)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('reminder_delete_me.unknown_reminder')}`});
  }

  let reminder: RestResponsesRaw.Reminder;
  try {
    reminder = await fetchReminderPositional(context, args.user.id, args.position);
  } catch(error) {
    if (error.response && error.response.statusCode === 404) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('reminder_delete_me.unknown_reminder')}`});
    }
    throw error;
  }

  // positions are per user across every server, so make sure it was made here
  if (!context.guildId || reminder.guild_id !== context.guildId) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('reminder_delete_me.unknown_reminder')}`});
  }

  await moveReminderToDms(context, reminder.id);

  const payload: DisplayPayload = {};
  payload.color = EmbedColors.LOG_CREATION;
  payload.title = translate('reminder_delete_server.moved_to_dms');
  const description = describeReminder(context, reminder, translate);
  if (args.user.id !== context.userId) {
    description.unshift(createUserString(args.user.id, args.user));
  }
  payload.description = description.join('\n');
  return displayReply(context, payload);
}

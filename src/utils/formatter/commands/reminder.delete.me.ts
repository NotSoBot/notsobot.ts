import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MarkupTimestampStyles, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { deleteReminder, fetchReminderPositional } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import {
  DisplayPayload,
  Parameters,
  createTimestampMomentFromGuild,
  displayReply,
  getReminderMessage,
} from '../../../utils';


export const COMMAND_ID = 'reminder.delete';

export interface CommandArgs {
  position: number | string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  let reminder: RestResponsesRaw.Reminder;
  try {
    reminder = await fetchReminderPositional(context, context.userId, args.position);
  } catch(error) {
    if (error.response && error.response.status === 404) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('reminder_delete_me.unknown_reminder')}`});
    }
    throw error;
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = translate('reminder_delete_me.are_you_sure_you_want_to_delete');

  {
    const description: Array<string> = [];
    {
      const serverId = context.guildId || null;
      const title = (reminder.guild_id === serverId) ? translate('reminder_delete_me.message_in_this_server') : translate('reminder_delete_me.message');
      let content: string;
      if (!reminder.content) {
        content = ''; //getReminderMessage(reminder.id);
      } else if (128 < reminder.content.length) {
        // maybe make this 69?
        content = `${Markup.codestring(reminder.content.slice(0, 126))}...`;
      } else {
        content = Markup.codestring(reminder.content);
      }
      
      const jumpLink = Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(reminder.guild_id, reminder.channel_id, reminder.message_id);
      const timestamp = Markup.timestamp(Date.parse(reminder.timestamp_start), MarkupTimestampStyles.RELATIVE);
      description.push(`${Markup.bold(String(reminder.position))}: ${Markup.url(title, jumpLink)} ${timestamp}`);
      if (content) {
        description.push(`-> ${content}`);
      }
    }
    payload.description = description.join('\n');
  }

  const components = new Components({timeout: 5 * (60 * 1000)});
  components.createButton({
    label: translate('reminder_delete_me.continue'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      try {
        await deleteReminder(context, reminder.id);
        payload.title = translate('reminder_delete_me.reminder_deleted');
        payload.color = EmbedColors.LOG_CREATION;
      } catch(error) {
        payload.color = EmbedColors.ERROR;
        payload.title = translate('reminder_delete_me.reminder_deletion_errored');
      }

      await displayReply(context, payload, {replyTo: ctx});
    },
  });

  components.createButton({
    label: translate('reminder_delete_me.cancel'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
  
      payload.color = EmbedColors.ERROR;
      payload.title = translate('reminder_delete_me.reminder_deletion_cancelled');
      await displayReply(context, payload, {replyTo: ctx});
    },
  });

  const message = await displayReply(context, {...payload, components});
  components.onTimeout = async () => {
    try {
      payload.color = EmbedColors.ERROR;
      payload.title = translate('reminder_delete_me.reminder_deletion_request_expired');
      payload.footer = translate('reminder_delete_me.request_expired_press_a_button_next_time');
      // edits the response for both prefixed commands and interactions
      await displayReply(context, payload);
    } catch(error) {
  
    }
  };
  return message;
}

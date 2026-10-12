import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MarkupTimestampStyles, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { deleteReminder, fetchReminderPositional } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import {
  Parameters,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let reminder: RestResponsesRaw.Reminder;
  try {
    reminder = await fetchReminderPositional(context, context.userId, args.position);
  } catch(error) {
    if (error.response && error.response.status === 404) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('reminder_delete_me.unknown_reminder')}`);
    }
    throw error;
  }

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle(translate('reminder_delete_me.are_you_sure_you_want_to_delete'));

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
    embed.setDescription(description.join('\n'));
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
        embed.setTitle(translate('reminder_delete_me.reminder_deleted'));
        embed.setColor(EmbedColors.LOG_CREATION);
      } catch(error) {
        embed.setColor(EmbedColors.ERROR);
        embed.setTitle(translate('reminder_delete_me.reminder_deletion_errored'));
      }

      await ctx.editOrRespond({components: [], embed});
    },
  });

  components.createButton({
    label: translate('reminder_delete_me.cancel'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
  
      embed.setColor(EmbedColors.ERROR);
      embed.setTitle(translate('reminder_delete_me.reminder_deletion_cancelled'));
      await ctx.editOrRespond({components: [], embed});
    },
  });

  const message = await editOrReply(context, {components, embed});
  components.onTimeout = async () => {
    try {
      embed.setColor(EmbedColors.ERROR);
      embed.setTitle(translate('reminder_delete_me.reminder_deletion_request_expired'));
      embed.setFooter(translate('reminder_delete_me.request_expired_press_a_button_next_time'));
      // todo: fix this for interactions
      if (message && message.canEdit) {
        await message.edit({components: [], embed});
      }
    } catch(error) {
  
    }
  };
  return message;
}

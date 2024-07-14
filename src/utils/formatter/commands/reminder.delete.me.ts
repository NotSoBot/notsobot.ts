import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MarkupTimestampStyles, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { deleteReminder, fetchReminderPositional } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { BooleanEmojis, EmbedColors } from '../../../constants';
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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let reminder: RestResponsesRaw.Reminder;
  try {
    reminder = await fetchReminderPositional(context, context.userId, args.position);
  } catch(error) {
    if (error.response && error.response.status === 404) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Reminder`);
    }
    throw error;
  }

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle('Are you sure you want to delete this reminder?');

  {
    const description: Array<string> = [];
    {
      const serverId = context.guildId || null;
      const title = (reminder.guild_id === serverId) ? 'Message in this Server' : 'Message';
      let content: string;
      if (!reminder.content) {
        content = getReminderMessage(reminder.id);
      } else if (128 < reminder.content.length) {
        // maybe make this 69?
        content = `${Markup.codestring(reminder.content.slice(0, 126))}...`;
      } else {
        content = Markup.codestring(reminder.content);
      }
      
      const jumpLink = Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(reminder.guild_id, reminder.channel_id, reminder.message_id);
      const timestamp = Markup.timestamp(Date.parse(reminder.timestamp_start), MarkupTimestampStyles.RELATIVE);
      description.push(`${Markup.bold(String(reminder.position))}: ${Markup.url(title, jumpLink)} ${timestamp}`);
      description.push(`-> ${content}`);
    }
    embed.setDescription(description.join('\n'));
  }

  const components = new Components({timeout: 5 * (60 * 1000)});
  components.createButton({
    label: 'Continue',
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      try {
        await deleteReminder(context, reminder.id);
        embed.setTitle('Reminder Deleted');
        embed.setColor(EmbedColors.LOG_CREATION);
      } catch(error) {
        embed.setColor(EmbedColors.ERROR);
        embed.setTitle('Reminder Deletion Errored');
      }

      await ctx.editOrRespond({components: [], embed});
    },
  });

  components.createButton({
    label: 'Cancel',
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
  
      embed.setColor(EmbedColors.ERROR);
      embed.setTitle('Reminder Deletion Cancelled');
      await ctx.editOrRespond({components: [], embed});
    },
  });

  const message = await editOrReply(context, {components, embed});
  components.onTimeout = async () => {
    try {
      embed.setColor(EmbedColors.ERROR);
      embed.setTitle('Reminder Deletion Request Expired');
      embed.setFooter('Request expired, press a button next time');
      // todo: fix this for interactions
      if (message && message.canEdit) {
        await message.edit({components: [], embed});
      }
    } catch(error) {
  
    }
  };
  return message;
}

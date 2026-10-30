import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { createReport, fetchCommandsResponses } from '../../../api';
import { RestOptions, RestResponsesRaw } from '../../../api/types';
import { getTranslator, Translator } from '../../i18n';
import { EmbedColors, ReportTypes, StatusEmojis } from '../../../constants';
import { DisplayPayload, displayReply, isSnowflake } from '../../../utils';


export const COMMAND_ID = 'report';
export const COMMAND_ID_BUG = 'report.bug';
export const COMMAND_ID_MESSAGE = 'report.message';
export const COMMAND_ID_SERVER = 'report.server';
export const COMMAND_ID_TAG = 'report.tag';
export const COMMAND_ID_USER = 'report.user';

export const MAX_CONTENT_LENGTH = 2000;

export interface CommandArgs {
  content: string,
  // the reported message, for message reports
  message?: Structures.Message,
  server?: string,
  // undefined when no tag was given, false when the given tag couldn't be found
  tag?: false | null | RestResponsesRaw.Tag,
  type: ReportTypes,
  // undefined when no user was given, null when the given user couldn't be found
  user?: Structures.Member | Structures.User | null,
}

// how long the Send Report button works
const CONFIRM_TIMEOUT = 5 * 60 * 1000;

// for the commands without a modal (prefixed ones, `/tag report`): the warning against report spam with a Send Report
// button, nothing is sent until it's pressed. Anything wrong with the report errors right away instead
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const resolved = await resolveReport(context, args, translate);
  if ('error' in resolved) {
    return displayReply(context, resolved.error);
  }

  const payload: DisplayPayload = {
    color: EmbedColors.DEFAULT,
    description: `${StatusEmojis.WARNING} ${translate('report.spam_warning')}`,
    ephemeral: true,
    title: translate('report.confirm'),
  };
  // once it's answered the buttons are gone, the payload is replaced
  const finish = (ctx: ComponentContext | null, update: DisplayPayload) => {
    components.clear();
    return displayReply(context, {ephemeral: true, ...update}, (ctx) ? {replyTo: ctx} : undefined);
  };

  const components = new Components({timeout: CONFIRM_TIMEOUT});
  components.createButton({
    label: translate('report.confirm_send'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      let update: DisplayPayload;
      try {
        update = sentPayload(translate, await createReport(context, resolved.options));
      } catch(error: any) {
        update = {color: EmbedColors.ERROR, description: `${StatusEmojis.WARNING} ${(error && error.message) || String(error)}`};
      }
      await finish(ctx, update);
    },
  });
  components.createButton({
    label: translate('report.confirm_cancel'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      await finish(ctx, {description: translate('report.confirm_cancelled')});
    },
  });
  components.onTimeout = async () => {
    try {
      // edits the response for both prefixed commands and interactions
      await finish(null, {description: translate('report.confirm_expired')});
    } catch(error) {

    }
  };
  return displayReply(context, {...payload, components});
}


// the modals respond through their own context (the warning was in the modal), so this only creates the report and
// returns what to show
export async function createPayload(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
): Promise<DisplayPayload> {
  const { translate } = await getTranslator(context);
  const resolved = await resolveReport(context, args, translate);
  if ('error' in resolved) {
    return resolved.error;
  }
  return sentPayload(translate, await createReport(context, resolved.options));
}


function sentPayload(translate: Translator['translate'], report: {id: string}): DisplayPayload {
  return {
    description: [
      `${StatusEmojis.YES} ${translate('report.sent')}`,
      translate('report.report_id', {id: Markup.codestring(report.id)}),
    ].join('\n'),
    ephemeral: true,
  };
}


// what the api needs for the report, or what to tell them when it can't be sent
async function resolveReport(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  translate: Translator['translate'],
): Promise<{error: DisplayPayload} | {options: RestOptions.CreateReport}> {
  const warn = (text: string) => ({error: {description: `${StatusEmojis.WARNING} ${text}`, ephemeral: true}});

  const content = (args.content || '').trim();
  if (!content) {
    return warn(translate('report.needs_content'));
  }

  let channelId: string | undefined = context.channelId;
  let guildId: string | undefined = context.guildId;
  let messageId: null | string = (context instanceof Command.Context) ? context.messageId : null;
  let tagId: string | undefined;
  let targetId: string | undefined;
  switch (args.type) {
    case ReportTypes.USER: {
      if (args.user === undefined) {
        return warn(translate('report.needs_user'));
      }
      if (!args.user) {
        return warn(translate('report.unknown_user'));
      }
      if (args.user.id === context.userId) {
        return warn(translate('report.cannot_report_yourself'));
      }
      targetId = args.user.id;
    }; break;
    case ReportTypes.SERVER: {
      targetId = args.server || context.guildId;
      if (!targetId || !isSnowflake(targetId)) {
        return warn(translate('report.needs_server'));
      }
    }; break;
    case ReportTypes.MESSAGE: {
      const { message } = args;
      if (!message) {
        throw new Error('Message reports need the reported message');
      }
      // the context menu only allows our own responses, they're reported for whoever used the command. someone
      // reporting their own command's response is reporting a bug in it, and when who used it is gone (the stored
      // response is cleaned up after a while) it's on us too, the api stores our own id when it's unknown
      const invoker = await findResponseInvoker(context, message);
      targetId = (invoker && invoker.userId !== context.userId) ? invoker.userId : message.author.id;
      tagId = (invoker && invoker.tagId) || undefined;
      // the message id points to the reported message instead of where the report was sent from
      channelId = message.channelId;
      guildId = message.guildId || context.guildId;
      messageId = message.id;
    }; break;
    case ReportTypes.TAG: {
      if (!args.tag) {
        return warn(translate('tag.unknown'));
      }
      if (args.tag.user.id === context.userId) {
        return warn(translate('report.cannot_report_yourself'));
      }
      targetId = args.tag.id;
    }; break;
  }

  return {options: {channelId, content, guildId, messageId, tagId, targetId, type: args.type}};
}


async function fetchCommandResponse(
  context: Command.Context | Interaction.InteractionContext,
  message: Structures.Message,
) {
  try {
    const { results } = await fetchCommandsResponses(context, {
      channelId: message.channelId,
      limit: 1,
      responseIds: [message.id],
    });
    return results[0] || null;
  } catch(error) {
    return null;
  }
}


// who used the command one of our responses answers (and its tag): the response we stored, the slash command's user, or
// who sent the message a prefixed command's reply answers. null when none of those are left
export async function findResponseInvoker(
  context: Command.Context | Interaction.InteractionContext,
  message: Structures.Message,
): Promise<{tagId: null | string, userId: string} | null> {
  const response = await fetchCommandResponse(context, message);
  if (response) {
    return {tagId: response.tag_id || null, userId: response.user_id};
  }
  if (message.interactionMetadata) {
    return {tagId: null, userId: message.interactionMetadata.user.id};
  }
  if (message.referencedMessage) {
    return {tagId: null, userId: message.referencedMessage.author.id};
  }
  // a replied to message doesn't come with what it replied to (the prefixed `report`'s)
  const reference = message.messageReference;
  if (!reference || !reference.messageId) {
    return null;
  }
  try {
    const raw = await context.rest.fetchMessage(message.channelId, reference.messageId);
    return (raw && raw.author) ? {tagId: null, userId: raw.author.id} : null;
  } catch(error) {
    // deleted
    return null;
  }
}


// prefixed `bot report user <user> <reason>` and `bot report server ?<server-id> <reason>` take the target as the first word
export function splitTarget(value: string): {rest: string, target: string} {
  value = value.trim();
  const index = value.search(/\s/);
  if (index === -1) {
    return {rest: '', target: value};
  }
  return {rest: value.slice(index).trim(), target: value.slice(0, index)};
}

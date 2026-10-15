import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { createReport } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { getTranslator } from '../../i18n';
import { ReportTypes, StatusEmojis } from '../../../constants';
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

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return displayReply(context, await createPayload(context, args));
}


// the slash command responds through its modal's context, so this only creates the report and returns what to show
export async function createPayload(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
): Promise<DisplayPayload> {
  const { translate } = await getTranslator(context);

  const content = (args.content || '').trim();
  if (!content) {
    return {description: `${StatusEmojis.WARNING} ${translate('report.needs_content')}`, ephemeral: true};
  }

  let channelId: string | undefined = context.channelId;
  let guildId: string | undefined = context.guildId;
  let messageId: null | string = (context instanceof Command.Context) ? context.messageId : null;
  let targetId: string | undefined;
  switch (args.type) {
    case ReportTypes.USER: {
      if (args.user === undefined) {
        return {description: `${StatusEmojis.WARNING} ${translate('report.needs_user')}`, ephemeral: true};
      }
      if (!args.user) {
        return {description: `${StatusEmojis.WARNING} ${translate('report.unknown_user')}`, ephemeral: true};
      }
      if (args.user.id === context.userId) {
        return {description: `${StatusEmojis.WARNING} ${translate('report.cannot_report_yourself')}`, ephemeral: true};
      }
      targetId = args.user.id;
    }; break;
    case ReportTypes.SERVER: {
      targetId = args.server || context.guildId;
      if (!targetId || !isSnowflake(targetId)) {
        return {description: `${StatusEmojis.WARNING} ${translate('report.needs_server')}`, ephemeral: true};
      }
    }; break;
    case ReportTypes.MESSAGE: {
      const { message } = args;
      if (!message) {
        throw new Error('Message reports need the reported message');
      }
      if (message.author.id === context.userId) {
        return {description: `${StatusEmojis.WARNING} ${translate('report.cannot_report_yourself')}`, ephemeral: true};
      }
      // the context menu only allows our own responses, they're reported for whoever used the command
      targetId = message.author.id;
      if (message.fromMe) {
        if (message.interactionMetadata) {
          targetId = message.interactionMetadata.user.id;
        } else if (message.referencedMessage) {
          targetId = message.referencedMessage.author.id;
        }
      }
      // the message id points to the reported message instead of where the report was sent from
      channelId = message.channelId;
      guildId = message.guildId || context.guildId;
      messageId = message.id;
    }; break;
    case ReportTypes.TAG: {
      if (!args.tag) {
        return {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`, ephemeral: true};
      }
      if (args.tag.user.id === context.userId) {
        return {description: `${StatusEmojis.WARNING} ${translate('report.cannot_report_yourself')}`, ephemeral: true};
      }
      targetId = args.tag.id;
    }; break;
  }

  const report = await createReport(context, {
    channelId,
    content,
    guildId,
    messageId,
    targetId,
    type: args.type,
  });

  return {
    description: [
      `${StatusEmojis.YES} ${translate('report.sent')}`,
      translate('report.report_id', {id: Markup.codestring(report.id)}),
    ].join('\n'),
    ephemeral: true,
  };
}


// prefixed `report user <user> <reason>` and `report server ?<server-id> <reason>` take the target as the first word
export function splitTarget(value: string): {rest: string, target: string} {
  value = value.trim();
  const index = value.search(/\s/);
  if (index === -1) {
    return {rest: '', target: value};
  }
  return {rest: value.slice(index).trim(), target: value.slice(0, index)};
}

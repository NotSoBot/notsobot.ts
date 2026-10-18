import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { StatusEmojis } from '../../../constants';
import { getGuildTranslator, getTranslator } from '../../i18n';
import { Parameters, displayReply, formatUserForAuditLog } from '../../../utils';


export const MAX_NICKNAME_LENGTH = 32;

export interface CommandArgsBefore {
  member: Structures.Member | Structures.User | null,
  nickname?: string,
}

export interface CommandArgs {
  member: Structures.Member,
  nickname?: string,
}

export const COMMAND_ID = 'moderation.nick';

// `<user> <nickname>`, the first word (quotes allowed) is the member and everything after it is the nickname
export async function parsePayload(
  value: string,
  context: Command.Context,
): Promise<CommandArgsBefore | null> {
  const match = value.trim().match(/^(?:"([^"]+)"|(\S+))\s*([\s\S]*)$/);
  if (!match) {
    return null;
  }
  const [ , quoted, word, nickname ] = match;
  const member = await Parameters.memberOrUser({memberOnly: true})(quoted || word, context);
  return {member, nickname};
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const { member } = args;
  const nickname = (args.nickname || '').trim();
  const user = `${member.mention} ${Markup.spoiler(`(${member})`)}`;

  if (MAX_NICKNAME_LENGTH < nickname.length) {
    return displayReply(context, {
      description: `${StatusEmojis.WARNING} ${translate('moderation_nick.too_long', {max: MAX_NICKNAME_LENGTH})}`,
    });
  }
  if (!context.me || !context.me.canEdit(member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_nick.bot_cannot_edit', {user})}`});
  }
  // the person running it has to outrank them too, not just the bot
  if (!context.member || !context.member.canEdit(member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_nick.user_cannot_edit', {user})}`});
  }

  // in the server's language since the whole server sees it
  const reason = (await getGuildTranslator(context)).translate('moderation_nick.audit_reason', {user: formatUserForAuditLog(context.user)});
  try {
    // an empty nickname clears it
    await member.editNick(nickname, {reason});
  } catch(error) {
    const text = Markup.codestring(String((error && (error as any).message) || error).slice(0, 100));
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_nick.failed', {error: text, user})}`});
  }

  if (nickname) {
    return displayReply(context, {description: translate('moderation_nick.changed', {nick: Markup.codestring(nickname), user})});
  }
  return displayReply(context, {description: translate('moderation_nick.reset', {user})});
}

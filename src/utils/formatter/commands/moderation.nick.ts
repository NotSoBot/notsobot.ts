import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { StatusEmojis } from '../../../constants';
import { getGuildTranslator, getTranslator } from '../../i18n';
import { Parameters, TagFormatter, displayReply, formatUserForAuditLog } from '../../../utils';


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

// the nickname is a tagscript, ran for each member it's for. none of these do anything useful in a nickname and most of
// them hit the network, the ai, storage or other tags (thousands of times with nick-mass). the limits below already stop
// anything that counts as a network request, this is so the rest errors too
// built on first use, `utils/index` imports the formatters before the tags so `TagFormatter` isn't there yet at load
let blockedTagFunctions: ReadonlySet<TagFormatter.TagFunctions> | null = null;
export function getBlockedTagFunctions(): ReadonlySet<TagFormatter.TagFunctions> {
  if (!blockedTagFunctions) {
    const { TagFunctions } = TagFormatter;
    blockedTagFunctions = new Set([
      // network/external apis
      TagFunctions.REQUEST,
      TagFunctions.TEXT,
      TagFunctions.TEXT_FROM_HTML,
      TagFunctions.API_AUDIO_IDENTIFY,
      TagFunctions.API_INFO_INVITE,
      TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES,
      TagFunctions.API_SEARCH_IMGUR,
      TagFunctions.API_SEARCH_REDDIT,
      TagFunctions.API_SEARCH_STEAM,
      TagFunctions.API_SEARCH_URBAN,
      TagFunctions.API_SEARCH_WIKIHOW,
      TagFunctions.API_SEARCH_WOLFRAM_ALPHA,
      TagFunctions.SEARCH_DUCKDUCKGO_IMAGES,
      TagFunctions.SEARCH_GOOGLE_IMAGES,
      TagFunctions.SEARCH_YOUTUBE,
      TagFunctions.API_UTILITIES_EXIF,
      TagFunctions.API_UTILITIES_LOCATIONS,
      TagFunctions.API_UTILITIES_QR_CREATE,
      TagFunctions.API_UTILITIES_QR_SCAN,
      TagFunctions.API_UTILITIES_SCREENSHOT,
      TagFunctions.API_UTILITIES_WEATHER,
      // ai/ml
      TagFunctions.AI,
      TagFunctions.AI_MEMORY_ADD,
      TagFunctions.AI_MEMORY_CLEAR,
      TagFunctions.AI_MEMORY_DELETE,
      TagFunctions.AI_MEMORY_EDIT,
      TagFunctions.IMAGE_INTERROGATE,
      TagFunctions.IMAGE_OCR,
      TagFunctions.TRANSCRIBE,
      TagFunctions.STRING_TRANSLATE,
      TagFunctions.NSFW_FILTER,
      TagFunctions.MEDIA_IMAGE_EDIT,
      TagFunctions.MEDIA_IMAGE_EDIT_URL,
      TagFunctions.MEDIA_IMAGE_IMAGINE,
      TagFunctions.MEDIA_IMAGE_IMAGINE_URL,
      // media/files/output a nickname can't have
      TagFunctions.MEDIA,
      TagFunctions.MEDIA_AUDIO,
      TagFunctions.MEDIA_AUDIO_OR_VIDEO,
      TagFunctions.MEDIA_IMAGE,
      TagFunctions.MEDIA_IMAGE_OR_VIDEO,
      TagFunctions.MEDIA_VIDEO,
      TagFunctions.MEDIASCRIPT,
      TagFunctions.MEDIASCRIPT_MAYBE_URL,
      TagFunctions.MEDIASCRIPT_URL,
      TagFunctions.ATTACHMENT,
      TagFunctions.ATTACHMENT_LAST,
      TagFunctions.ATTACHMENT_SPOILER,
      TagFunctions.ATTACHMENT_TEXT,
      TagFunctions.ATTACHMENT_VOICE,
      TagFunctions.LOGICAL_GET_FILE_NAME,
      TagFunctions.LOGICAL_SET_FILE_NAME,
      TagFunctions.EMBED_JSON,
      TagFunctions.COMPONENT_JSON,
      TagFunctions.COMPONENTS_ON_TIMEOUT,
      TagFunctions.PAGE_JSON,
      // persistent writes
      TagFunctions.LOGICAL_SET_CHANNEL,
      TagFunctions.LOGICAL_SET_GLOBAL,
      TagFunctions.LOGICAL_SET_SERVER,
      TagFunctions.LOGICAL_SET_USER,
      TagFunctions.LOGICAL_DELETE_CHANNEL,
      TagFunctions.LOGICAL_DELETE_SERVER,
      TagFunctions.LOGICAL_DELETE_USER,
      TagFunctions.API_CREATE_REMINDER,
      TagFunctions.API_DELETE_REMINDER,
      TagFunctions.API_EDIT_REMINDER,
      TagFunctions.API_FETCH_REMINDERS,
      TagFunctions.SETTINGS_SET_SERVER_AI_PERSONALITY,
      TagFunctions.SETTINGS_SET_USER,
      TagFunctions.SETTINGS_SET_USER_AI_PERSONALITY,
      TagFunctions.SETTINGS_SET_USER_LOCALE,
      TagFunctions.SETTINGS_SET_USER_TIMEZONE,
      // persistent reads
      TagFunctions.LOGICAL_GET_CHANNEL,
      TagFunctions.LOGICAL_GET_GLOBAL,
      TagFunctions.LOGICAL_GET_SERVER,
      TagFunctions.LOGICAL_GET_USER,
      TagFunctions.VARIABLES_CHANNEL,
      TagFunctions.VARIABLES_GLOBAL,
      TagFunctions.VARIABLES_SERVER,
      TagFunctions.VARIABLES_USER,
      TagFunctions.SETTINGS,
      // other tags, they could contain anything
      TagFunctions.TAG,
      TagFunctions.TAG_CONTENT,
    ]);
  }
  return blockedTagFunctions;
}

export const NICKNAME_TAG_LIMITS: Partial<TagFormatter.TagLimits> = Object.freeze({
  MAX_AI_EXECUTIONS: 0,
  MAX_API_MANIPULATIONS: 0,
  MAX_ATTACHMENTS: 0,
  MAX_COMPONENT_EXECUTIONS: 0,
  MAX_EMBEDS: 0,
  MAX_ITERATIONS: 100,
  MAX_NETWORK_REQUESTS: 0,
  MAX_NETWORK_REQUESTS_ML: 0,
  MAX_NETWORK_REQUESTS_SAFETY: 0,
  MAX_PAGES: 0,
  MAX_STORAGE_CHANNEL_AMOUNT: 0,
  MAX_STORAGE_GLOBAL_AMOUNT: 0,
  MAX_STORAGE_GUILD_AMOUNT: 0,
  MAX_STORAGE_USER_AMOUNT: 0,
  MAX_TAG_EXECUTIONS: 0,
  MAX_TIME: 2 * 1000,
  MAX_TIME_PREMIUM: 2 * 1000,
  MAX_TIME_PREMIUM_FROM_SERVER: 2 * 1000,
  MAX_TIME_PREMIUM_PLUS: 2 * 1000,
  MAX_TIME_PREMIUM_PLUS_AI: 2 * 1000,
  MAX_TEXT_LENGTH: 4 * 1024,
});

// from before nicknames were tagscript: `{name}` was their nickname (in tagscript it's their username) and
// `{discriminator}` isn't a tagscript function
const LegacyFunctionRegexes = Object.freeze([
  [/\{\s*name\s*\}/gi, '{nick}'],
  [/\{\s*discriminator\s*\}/gi, '{discrim}'],
] as const);

export interface NicknameScript {
  // whether it has any functions, without them it's the same for everyone
  isScript: boolean,
  // the nickname for this member, whitespace collapsed and trimmed but not cut to `MAX_NICKNAME_LENGTH`
  render: (member: Structures.Member) => Promise<string>,
  text: string,
}

export function createNicknameScript(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
): NicknameScript {
  let text = value;
  for (let [regex, replacement] of LegacyFunctionRegexes) {
    text = text.replace(regex, replacement);
  }
  const isScript = text.includes(TagFormatter.TagSymbols.BRACKET_LEFT);
  // reused for every member so {math}'s worker is too, only `targetMember` changes
  const tagContext: TagFormatter.TagContext = {
    blockedFunctions: getBlockedTagFunctions(),
    blocksCode: true,
    targetMember: undefined,
  };
  return {
    isScript,
    render: async (member) => {
      let nickname = text;
      if (isScript) {
        tagContext.targetMember = member;
        const tag = await TagFormatter.parse(context, text, '', Object.create(null), tagContext, NICKNAME_TAG_LIMITS);
        nickname = tag.text;
      }
      return nickname.replace(/\s+/g, ' ').trim();
    },
    text,
  };
}


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
  const user = `${member.mention} ${Markup.spoiler(`(${member})`)}`;

  if (!context.me || !context.me.canEdit(member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_nick.bot_cannot_edit', {user})}`});
  }
  // the person running it has to outrank them too, not just the bot
  if (!context.member || !context.member.canEdit(member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_nick.user_cannot_edit', {user})}`});
  }

  let nickname: string;
  try {
    nickname = await createNicknameScript(context, args.nickname || '').render(member);
  } catch(error) {
    const text = Markup.codestring(String((error && (error as any).message) || error).slice(0, 100));
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_nick.invalid_nickname', {error: text})}`});
  }
  // checked on what the script came out as, the script itself is usually longer
  if (MAX_NICKNAME_LENGTH < nickname.length) {
    return displayReply(context, {
      description: `${StatusEmojis.WARNING} ${translate('moderation_nick.too_long', {max: MAX_NICKNAME_LENGTH})}`,
    });
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

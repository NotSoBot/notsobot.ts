import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import CommandResponsesStore, { TRACK_DURATION } from '../../../stores/commandresponses';
import GuildSettingsStore from '../../../stores/guildsettings';
import UserSettingsStore from '../../../stores/usersettings';

import {
  fetchCommandsResponses,
  generateTag,
  generateTagVoice,
  mediaAIVToolsAnalyze,
  putGeneratedTagError,
  utilitiesFetchText,
} from '../../../api';
import { RestOptions, RestResponsesRaw } from '../../../api/types';
import { TagGenerationPersonalityPreferences, TAG_GENERATION_PERSONALITY_DEFAULT } from '../../../constants';
import { getRunErrorResult, setCommandResult } from '../../../commandresults';
import { captureCommandError, captureError } from '../../../sentry';
import { detachReply } from '../../commandresponses';
import { CommandRunCancelledError, UserError } from '../../errors';
import {
  Paginator,
  Parameters,
  THINKING_REPLY_AFTER,
  TagFormatter,
  ThinkingReply,
  checkNSFW,
  displayDetailsLine,
  displayReply,
  editOrReply,
  findMediaUrlInMessage,
  getCommandRunSignal,
  timeLimitParts,
} from '../../../utils';

import { Translator, getTranslator, randomAIThinkingText } from '../../i18n';

import { formatCreditsAlert } from './credits';
import { canControlMusic, musicItemTitle } from './music.shared';
import {
  TagMessageAIOptions,
  TagReplyTarget,
  createTagMessage,
  tagTimeLimitText,
} from './tag.show';


export const COMMAND_ID = 'tag.generate';

export const MAX_TEXT_FILE_LENGTH = 20000;

// NotSoAI response id -> if its prompt had someone else's text (a reply, a link, a file that isn't the user's own
// upload). a conversation keeps its earlier turns, so that text is still there when the user replies to continue it.
// a response that isn't in here (an older process, or `.refresh`) counts as having it
const UNTRUSTED_RESPONSES = new Collections.BaseCollection<string, boolean>({expire: TRACK_DURATION});

export interface CommandArgsBefore {
  debug?: boolean,
  debugFull?: boolean,
  model?: string,
  personalityPreference?: string,
  prompt: string,
}

export interface CommandArgs {
  debug?: boolean,
  debugFull?: boolean,
  model?: string,
  personalityPreference?: string,
  prompt: string,
  url?: null | string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // "premium max · ai is ruminating" while NotSoAI writes, then the tag's countdown once its tagscript runs
  const thinking = new ThinkingReply(context, (translate) => aiWritingText(context, translate));
  try {
    return await generateAndRunTag(context, args, thinking);
  } finally {
    await thinking.stop();
  }
}


// one thing said to NotSoAI in voice (`.ai listen`): answered like a message (a new reply each turn), its spoken
// sentences go to `onSpeech` as they're written (`audio` a base64 ogg opus file, null when the speech couldn't be made)
export interface AIVoiceTurn {
  // shown above the reply, so a misheard word is easy to spot
  heard?: string,
  onSpeech: (audio: null | string, text: string) => void,
  // the turn before's response, so the whole session is one conversation
  parentId: null | string,
  // set once the api answered, the next turn's `parentId`
  responseId?: string,
}

// `prompt` is what they said (transcribed). The command's reply isn't edited, each turn sends its own (replying to one
// continues the conversation in text). The one before stays grouped with the command, deleting it deletes them all
export async function createVoiceMessage(context: Command.Context, prompt: string, voice: AIVoiceTurn) {
  detachReply(context);
  const thinking = new ThinkingReply(context, (translate) => aiWritingText(context, translate));
  try {
    return await generateAndRunTag(context, {prompt}, thinking, undefined, voice);
  } catch(error) {
    // the run finished long ago, nothing else deletes a turn's "Thinking..." an api error (credits, a ratelimit) left
    // up: it was filed with the command's extras and the error posted under it
    await thinking.stop();
    const message = thinking.message;
    if (message && !thinking.replaced && !message.deleted) {
      await message.delete().catch(() => null);
    }
    throw error;
  } finally {
    await thinking.stop();
  }
}


// NotSoAI's reply continued from one of its own `ai`/`ai_input` components
interface AIContinuation {
  parentId: string,
  replyTo: TagReplyTarget,
}

// a press on one of NotSoAI's `ai` components (or the text typed into its `ai_input`): sent as the asker's next message
// in the conversation, with its history, charged like one, and answered on the press's response (a new message). The
// command already finished, so its errors go on that message instead of the command's error handler
async function continueAI(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  parentId: string,
  replyTo: TagReplyTarget,
  prompt: string,
) {
  const thinking = new ThinkingReply(context, (translate) => aiWritingText(context, translate), replyTo);
  try {
    await generateAndRunTag(context, {
      model: args.model,
      personalityPreference: args.personalityPreference,
      prompt,
    }, thinking, {parentId, replyTo});
  } catch(error) {
    await thinking.stop();
    captureCommandError(context, error, 'ai_continue');
    // required here, commands/errors imports utils (and this file with it) back
    const { createRunErrorPayload, replyError, warning }: typeof import('../../../commands/errors') = require('../../../commands/errors');
    try {
      const translator = await getTranslator(context);
      const title = warning(translator.translate('errors.prefix_run_title'));
      await replyError(context, await createRunErrorPayload(context, title, error, translator), {replyTo});
    } catch(e) {

    }
  } finally {
    await thinking.stop();
  }
}


// the tier is the same one the tag will run with, there's no countdown yet since writing it isn't on the tag's clock
async function aiWritingText(
  context: Command.Context | Interaction.InteractionContext,
  translate: Translator['translate'],
): Promise<string> {
  const { tier } = await TagFormatter.getMaxTimeTier(context, TagFormatter.TagLimitDefaults);
  return `-# ${[...timeLimitParts(translate, tier, null), randomAIThinkingText(translate)].join(' · ')}`;
}


// the NotSoAI response a message of ours holds, only when it was this user's (the api only continues their own too)
async function fetchAIParentId(context: Command.Context, message: Structures.Message): Promise<string | null> {
  if (!message.author.isMe) {
    return null;
  }
  const stored = CommandResponsesStore.llmResponses.get(message.id);
  if (stored) {
    return (stored.userId === context.userId) ? stored.id : null;
  }
  if (message.interaction) {
    if (message.interaction.name !== 'ai' || message.interaction.user.id !== context.userId) {
      return null;
    }
  } else if (CommandResponsesStore.getResponseCommandId(context.client, message.id) !== undefined) {
    // sent while this process was watching, a NotSoAI reply from then would've been stored above
    return null;
  }
  try {
    const { results } = await fetchCommandsResponses(context, {
      channelId: message.channelId,
      responseIds: [message.id],
    });
    const result = results.find((x) => x.message_response_id === message.id && x.command_id === COMMAND_ID);
    return (result && result.llm_response_id && result.user_id === context.userId) ? result.llm_response_id : null;
  } catch(error) {
    return null;
  }
}


async function generateAndRunTag(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  thinking: ThinkingReply,
  continuation?: AIContinuation,
  voice?: AIVoiceTurn,
) {
  const urls: Array<string> = [];
  const promptExtra: Array<string> = [];
  // someone else's text is in the prompt, NotSoAI can't change or read out the user's settings, memory, reminders or
  // tags then. the url option can point at anything
  let isUntrusted = !!args.url;
  // replying to NotSoAI continues that conversation, the api sends its earlier turns (with the code it wrote)
  let parentId: null | string = null;
  if (continuation) {
    // a press has no message of its own, the conversation (and its media) is already in the earlier turns
    parentId = continuation.parentId;
    if (UNTRUSTED_RESPONSES.get(parentId) !== false) {
      isUntrusted = true;
    }
  } else if (voice) {
    // only what they said, the command message's media and replies were for starting the listen
    parentId = voice.parentId;
    if (parentId && UNTRUSTED_RESPONSES.get(parentId) !== false) {
      isUntrusted = true;
    }
  } else if (context instanceof Command.Context) {
    // only the media from the command message itself and the first media found going up the reply chain
    const current = findMediaForAI(context.message);
    const currentText = (current && current.isText) ? await fetchTextForAI(context, current.url) : null;
    // a link's preview, not a file they uploaded
    if (current && !isOwnAttachment(context.message, current.url)) {
      isUntrusted = true;
    }
    let reply: null | {isText: boolean, url: string} = null;

    let { message } = context;
    let chain = 0;
    while (chain++ < 5 && message.messageReference) {
      const { messageReference } = message;
      if (messageReference && messageReference.messageId) {
        try {
          message = messageReference.message || await context.rest.fetchMessage(
            messageReference.channelId,
            messageReference.messageId,
          );
        } catch(error) {
          promptExtra.push([
            `Message Reply Context ${chain}`,
            (error.response) ? `-> Fetching Errored due to status code ${error.response.statusCode}` : '-> Unable to fetch data',
          ].filter(Boolean).join('\n'));
          break;
        }

        let mediaIsFromHere = false;
        let replyText: null | string = null;
        if (!reply) {
          reply = findMediaForAI(message);
          mediaIsFromHere = !!reply;
          if (reply && reply.isText) {
            replyText = await fetchTextForAI(context, reply.url);
          }
        }

        // the rest of the chain is already in the conversation, only say where its media came from
        parentId = await fetchAIParentId(context, message);
        if (parentId) {
          if (UNTRUSTED_RESPONSES.get(parentId) !== false) {
            isUntrusted = true;
          }
          // the tagscript runs on this reply, so a lookup that found the earlier turn's media finds the result now. one
          // link back to that media instead of its urls (10 cdn urls were ~1k tokens on every turn)
          const earlierLink = await findEarlierMediaLink(context, message);
          promptExtra.push([
            `Message Reply Context ${chain}`,
            '-> Your previous reply in this conversation',
            (earlierLink) ? `-> Media lookups ({media}, {medialist}, ...) find this reply's media now. The media your earlier turn used is in ${earlierLink}, \`{medialist:TYPE|MAX|${earlierLink}}\` starts there (then older media until MAX)` : null,
            (replyText) ? `-> Text File: ${replyText}` : null,
            (mediaIsFromHere && !reply!.isText) ? '-> Media is from here' : null,
          ].filter(Boolean).join('\n'));
          break;
        }

        // their own messages are fine, as long as the media isn't a link's preview or a forward's
        if (message.author.id !== context.userId || (mediaIsFromHere && !isOwnAttachment(message, reply!.url))) {
          isUntrusted = true;
        }

        const content: Array<string> = [];
        if (replyText) {
          content.push(`-> Text File: ${replyText}`);
        }
        if (message.content) {
          content.push(`-> Content: ${JSON.stringify(message.content)}`);
        }
        if (message.components.length) {
          // the text inside components v2 (text displays, labels, media urls), the raw json was mostly noise
          const componentsText = componentsToText(JSON.parse(JSON.stringify(message.components)));
          if (componentsText) {
            content.push(`-> Components: ${JSON.stringify(componentsText)}`);
          }
        }
        if (message.embeds.length) {
          for (let [embedId, embed] of message.embeds) {
            const embedText = embedToText(JSON.parse(JSON.stringify(embed)));
            if (embedText) {
              content.push(`-> Embed: ${JSON.stringify(embedText)}`);
            }
          }
        }

        if (content.length) {
          promptExtra.push([
            `Message Reply Context ${chain}`,
            `-> Author: ${JSON.stringify(message.author.name)}`,
            ...content,
            (mediaIsFromHere && !reply!.isText) ? '-> Media is from here' : null,
            (message.deleted) ? `-> Message Deleted` : null,
          ].filter(Boolean).join('\n'));
        }

        /*
        const replyText = content.filter(Boolean).join('\n\n').trim();
        if (replyText) {
          promptExtra.push([
            `Message Reply Context ${chain}`,
            `-> Author: ${JSON.stringify(message.author.name)}`,
            `-> Content: ${JSON.stringify(replyText)}`,
            (url && mediaIsFromHere) ? '-> Media is from here' : null,
            (message.deleted) ? `-> Message Deleted` : null,
          ].filter(Boolean).join('\n'));
        }
        */
      }
    }

    if (current && !current.isText) {
      urls.push(current.url);
    }
    if (reply && !reply.isText && (!current || reply.url !== current.url)) {
      urls.push(reply.url);
    }

    if (promptExtra.length || currentText) {
      promptExtra.unshift([
        `Current Message Context`,
        `-> Author: ${JSON.stringify(context.message.author.name)}`,
        (currentText) ? `-> Text File: ${currentText}` : null,
        (current && !current.isText) ? '-> Media is from here' : null,
      ].filter(Boolean).join('\n'));
    }
  } else if (context instanceof Interaction.InteractionContext) {
    if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments) {
      for (let [attachmentId, attachment] of context.data.resolved.attachments) {
        if (isTextContentType(attachment.contentType)) {
          const text = await fetchTextForAI(context, attachment.url);
          if (text) {
            promptExtra.push(`Text File ${JSON.stringify(attachment.filename)}: ${text}`);
          }
        } else {
          urls.push(attachment.url);
        }
      }
    }
  }

  // the url option goes first, it's what they explicitly pointed NotSoAI at
  if (args.url && !urls.includes(args.url)) {
    urls.unshift(args.url);
  }

  const [ personality, serverPersonality, userPersonality ] = await getAIPersonality(
    context, args.prompt, args.personalityPreference,
  );

  const now = Date.now();
  const generateOptions: RestOptions.GenerateTag = {
    creditsAlert: true,
    memory: true,
    model: args.model,
    parentId: parentId || undefined,
    personality,
    personalityPreference: args.personalityPreference,
    prompt: [args.prompt, ...promptExtra].join('\n'),
    // an edit (or delete) of the trigger stops waiting on it. Not a continuation: its press came after the run ended, an
    // edit since then would abort it for nothing
    signal: (continuation) ? undefined : getCommandRunSignal(context),
    situation: getAISituation(context, !!continuation),
    urls,
  };
  let response: RestResponsesRaw.GenerateTag;
  if (voice) {
    generateOptions.situation = {...generateOptions.situation!, invoked: 'voice', ...getAIVoiceMembers(context)};
    response = await generateTagVoice(context, generateOptions, (line) => {
      voice.onSpeech(line.audio, line.text);
    });
  } else {
    response = await generateTag(context, generateOptions);
  }
  if (response.id) {
    // saved with the command's response (`onFinally`), so a reply to it can continue this conversation. a continuation's
    // (and a voice turn's) message is stored once it's sent, the command's own reply keeps the first response
    if (!continuation && !voice) {
      context.metadata = Object.assign({}, context.metadata, {llmResponseId: response.id});
    }
    if (voice) {
      voice.responseId = response.id;
    }
    UNTRUSTED_RESPONSES.set(response.id, isUntrusted);
  }
  if (args.debug || args.debugFull) {
    await thinking.stop();
  }
  if (args.debugFull) {
    return editOrReply(context, {
      content: [
        'Model: ' + response.model,
        'Prompt Complexity Level: ' + response.prompt_complexity_level,
        ...formatCheckDebug(response),
        `Tokens Input Count: ` + [
          `${response.usage.input_tokens}`,
          (response.usage.input_tokens_cached) ? `(Cached: ${response.usage.input_tokens_cached})` : '',
          (response.usage.input_tokens_cached_created) ? `(Cached Created: ${response.usage.input_tokens_cached_created})` : '',
        ].filter(Boolean).join(' '),
        `Tokens Output Count: ` + [
          `${response.usage.output_tokens}`,
          (response.usage.output_tokens_reasoning) ? `(Reasoning: ${response.usage.output_tokens_reasoning})` : '',
        ].filter(Boolean).join(' '),
        `Took: ${Date.now() - now}`,
      ].join('\n'),
      file: {filename: 'response.txt', value: response.text_full},
    });
  } else if (args.debug) {
    return editOrReply(context, {
      content: [
        'Model: ' + response.model,
        'Prompt Complexity Level: ' + response.prompt_complexity_level,
        ...formatCheckDebug(response),
        'Took: ' + String(Date.now() - now),
      ].join('\n'),
      file: {filename: 'response.txt', value: response.text},
    });
  }

  // moved up by however long they took to answer a confirmation, the run's time limit is pushed back the same
  let startedAt = Date.now();
  // most generated tagscript is done right away, only switch to its countdown once it's actually taking a while
  thinking.setStatus((translate) => tagTimeLimitText(context, translate, startedAt), THINKING_REPLY_AFTER);
  const replyTo = (continuation) ? continuation.replyTo : undefined;
  const confirmAction = createAIConfirmAction(context, thinking, (waited) => startedAt += waited, replyTo);
  // its `ai`/`ai_input` components continue this conversation from this response
  const responseId = response.id;
  const aiOptions: TagMessageAIOptions | undefined = (responseId) ? {
    onContinue: (target, prompt) => continueAI(context, args, responseId, target, prompt),
  } : undefined;
  try {
    const parsedTag = await TagFormatter.parse(context, response.text, '', {
      defaultPersonality: TAG_GENERATION_PERSONALITY_DEFAULT,
      personality: personality || TAG_GENERATION_PERSONALITY_DEFAULT,
      serverPersonality,
      userPersonality,
      // NotSoAI wrote this, unlocks the NotSoAI-only functions (unless someone else's text was in its prompt)
      [TagFormatter.PrivateVariables.IS_FROM_AI]: 1,
      [TagFormatter.PrivateVariables.AI_PROMPT_UNTRUSTED]: (isUntrusted) ? 1 : 0,
      [TagFormatter.PrivateVariables.SETTINGS]: {
        [TagFormatter.TagSettings.AI_MODEL]: args.model,
      },
    } as any, {aiMemoryIds: response.memory_ids, confirmAction});

    // always say when NotSoAI changed what it remembers, instead of trusting it to mention it
    const memoryChanges = TagFormatter.getAIMemoryChanges(parsedTag);
    if (memoryChanges) {
      const { translate } = await getTranslator(context);
      const receipt = (memoryChanges.added && !memoryChanges.changed) ? translate('tag_generate.memory_saved') : translate('tag_generate.memory_updated');
      parsedTag.text = [parsedTag.text.trimEnd(), `-# 🧠 ${receipt}`].join('\n');
    }
    if (parsedTag.variables[TagFormatter.PrivateVariables.AI_WRITES_BLOCKED]) {
      const { translate } = await getTranslator(context);
      parsedTag.text = [parsedTag.text.trimEnd(), `-# ${translate('tag_generate.untrusted_prompt_blocked')}`].join('\n');
    }
    if (parsedTag.variables[TagFormatter.PrivateVariables.AI_WRITES_DECLINED]) {
      const { translate } = await getTranslator(context);
      parsedTag.text = [parsedTag.text.trimEnd(), `-# ${translate('tag_generate.confirm_declined')}`].join('\n');
    }
    if (voice) {
      // its tagscript said nothing in text (`{ai.listen.stop}` after a goodbye, a music control): what it said aloud
      if (!parsedTag.text.trim() && response.voice) {
        parsedTag.text = Markup.escape.all(response.voice);
      }
      // what it queued: its spoken "putting on Baby" isn't in the text channel, the tagscript's text is whatever it
      // picked out of the json (often just the title)
      const musicPlayed = TagFormatter.getAIMusicPlayed(parsedTag);
      if (musicPlayed.length) {
        const { language, translate } = await getTranslator(context);
        const lines = musicPlayed.map((played) => displayDetailsLine([
          `**${(played.collection) ? Markup.escape.all(played.collection) : musicItemTitle(played.item)}**`,
          (played.collection) ? translate('music_play.added_tracks', {count: played.added.toLocaleString(language)}) : null,
          (played.position === 1) ? translate('music_play.plays_now') : null,
          (played.position && 1 < played.position) ? translate('music_play.plays_as', {position: played.position.toLocaleString(language)}) : null,
        ]));
        parsedTag.text = [parsedTag.text.trimEnd(), ...lines].join('\n');
      }
      if (voice.heard) {
        parsedTag.text = [`-# Heard: ${Markup.escape.all(JSON.stringify(voice.heard))}`, parsedTag.text].join('\n');
      }
    }
    // they used up most of the week's credits, said once a week
    if (response.credits_alert) {
      const { language, translate } = await getTranslator(context);
      parsedTag.text = [parsedTag.text.trimEnd(), formatCreditsAlert(response.credits_alert, language, translate)].join('\n');
    }
    await thinking.stop();
    const result = await createTagMessage(context, parsedTag, undefined, replyTo, {
      ai: aiOptions,
      continuation: !!continuation,
    });
    // what replying to the new message continues from (the command's own reply is stored by its `onFinally`)
    if (replyTo && responseId) {
      const message = await replyTo.fetchResponse().catch(() => null);
      if (message) {
        CommandResponsesStore.insertLLMResponse(message.id, responseId, context.userId);
      }
    } else if (voice && responseId && context instanceof Command.Context && context.response) {
      CommandResponsesStore.insertLLMResponse(context.response.id, responseId, context.userId);
    }
    return result;
  } catch(error) {
    await thinking.stop();
    // the trigger was edited or deleted while its tagscript ran (an aborted `{ai}`, a cancelled job), NotSoAI's
    // tagscript didn't break and there's nothing to reply on
    if (error instanceof CommandRunCancelledError) {
      throw error;
    }
    if (response.id) {
      try {
        await putGeneratedTagError(context, response.id, {error: error.message.slice(0, 6000)});
      } catch(e) {
        
      }
    }

    // caught here so it can reply with the debug info, but it still counts as the run erroring. NotSoAI writing broken
    // tagscript is already kept with the generated tag above, only our own failures go to sentry. api responses were
    // reported where they were seen (and coded ones, like media blocked for being nsfw, are expected)
    if (!continuation && !voice) {
      setCommandResult(context, await getRunErrorResult(error));
    }
    if (!TagFormatter.isTagError(error) && !error.response && !(error instanceof UserError)) {
      captureError(error, {
        context,
        // the prompt and result stay in our db with the generated tag, look them up by its id instead of copying them to sentry
        extra: {
          generated_tag_id: response.id,
          prompt_complexity_level: response.prompt_complexity_level,
          took: Date.now() - now,
          usage: response.usage,
        },
        tags: {model: response.model},
      });
    }

    return editOrReply(replyTo || context, {
      content: [
        'TagScript processing errored',
        'Model: ' + response.model,
        'Prompt Complexity Level: ' + response.prompt_complexity_level,
        'Took: ' + String(Date.now() - now),
        Markup.codeblock(error.message.slice(0, 1800)),
      ].join('\n'),
      file: {filename: 'response.txt', value: response.text},
    }); 
  }
}



// the default prefix, what a server without its own (or a dm) uses
const DEFAULT_PREFIXES = ['.'];

// who else NotSoAI is talking in front of on a voice turn, the api's cap
const MAX_AI_VOICE_MEMBERS = 10;
const MAX_AI_VOICE_MEMBER_NAME_LENGTH = 64;

// the people (not bots, not us) in the asker's voice channel besides them, from the cache. Only voice turns send it:
// "tell Sam..." and "who's here" are about the room there, in text it would be paid for on every message
function getAIVoiceMembers(
  context: Command.Context | Interaction.InteractionContext,
): Pick<RestOptions.GenerateTagSituation, 'voice_members' | 'voice_members_count'> {
  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;
  if (!member || !channel) {
    return {};
  }
  const members: NonNullable<RestOptions.GenerateTagSituation['voice_members']> = [];
  let count = 0;
  for (let [, state] of channel.voiceStates) {
    const other = state.member;
    // not cached as a member, the user can still say it's a bot
    const user = (other) ? null : context.client.users.get(state.userId);
    if (state.userId === member.id || state.userId === context.client.userId || (other && other.bot) || (user && user.bot)) {
      continue;
    }
    count++;
    if (members.length < MAX_AI_VOICE_MEMBERS) {
      const name = (other) ? other.name : (user) ? user.name : null;
      members.push({
        ...((state.deaf || state.selfDeaf) ? {deaf: true} : {}),
        id: state.userId,
        name: (name || 'unknown').slice(0, MAX_AI_VOICE_MEMBER_NAME_LENGTH),
      });
    }
  }
  return {voice_members: members, voice_members_count: count};
}

// where this is and who's asking, for the api's prompt (`generate_situation_prompt`). Everything here is already in
// memory, nothing is fetched for it
function getAISituation(
  context: Command.Context | Interaction.InteractionContext,
  fromButton: boolean,
): RestOptions.GenerateTagSituation {
  const situation: RestOptions.GenerateTagSituation = {invoked: 'slash', location: 'bot_dm'};

  if (fromButton) {
    situation.invoked = 'button';
  } else if (context instanceof Command.Context) {
    const prefix = context.prefix || '';
    if (!prefix) {
      situation.invoked = 'reply';
    } else if (context.commandClient.prefixes.mention.has(prefix)) {
      situation.invoked = 'mention';
    } else {
      situation.invoked = 'prefix';
      situation.used_prefix = prefix;
    }
  }

  const { member } = context;
  situation.display_name = ((member) ? member.name : context.user.name).slice(0, 64);

  if (context.guildId) {
    situation.location = (context.isBotPresent) ? 'server' : 'server_user_app';
    if (context.guild) {
      situation.server_name = context.guild.name.slice(0, 100);
    }
    // a server we're not in has no settings, music or knowledge to change, so it doesn't matter there
    if (context.isBotPresent) {
      if (member) {
        situation.manage_server = member.canManageGuild;
      }
      const settings = GuildSettingsStore.get(context.guildId);
      const prefixes = (settings && settings.prefixes.length) ? settings.prefixes.map(({prefix}) => prefix) : DEFAULT_PREFIXES;
      situation.prefixes = prefixes.slice(0, 10);
      if (member) {
        situation.music_dj = canControlMusic(member);
        const voiceState = member.voiceState;
        if (voiceState && voiceState.channelId) {
          situation.voice_channel_id = voiceState.channelId;
        }
      }
    }
  } else if (context instanceof Interaction.InteractionContext && context.interaction.inDmWithUsers) {
    const { channel } = context;
    situation.location = (channel && channel.isDmGroup) ? 'group_dm' : 'private_channel';
    if (channel && channel.isDmGroup && channel.name) {
      situation.channel_name = channel.name.slice(0, 100);
    }
  } else {
    situation.prefixes = (context instanceof Command.Context) ? Array.from(context.commandClient.prefixes.custom) : DEFAULT_PREFIXES;
  }
  return situation;
}


// how long NotSoAI's confirmation buttons wait, no answer counts as Cancel
export const AI_CONFIRM_TIMEOUT = 60 * 1000;

// NotSoAI asking before a function runs (`TagFormatter.confirmAIAction`): the call itself on the thinking reply with
// Allow and Cancel, only the command user's presses count. `onWait` gets how long it waited, for the countdown
function createAIConfirmAction(
  context: Command.Context | Interaction.InteractionContext,
  thinking: ThinkingReply,
  onWait: (waited: number) => void,
  replyTo?: TagReplyTarget,
): TagFormatter.AIConfirmAction {
  return (call, reason) => thinking.hold(async () => {
    const { translate } = await getTranslator(context);
    const startedAt = Date.now();
    try {
      return await new Promise<boolean>((resolve, reject) => {
        let answered = false;
        const answer = (allowed: boolean) => {
          if (!answered) {
            answered = true;
            components.clear();
            resolve(allowed);
          }
        };

        const components = new Components({timeout: AI_CONFIRM_TIMEOUT, onTimeout: () => answer(false)});
        // answered before the press is acknowledged, a failed acknowledgement shouldn't leave the run waiting it out
        const press = (allowed: boolean) => async (ctx: ComponentContext) => {
          if (ctx.userId === context.userId) {
            answer(allowed);
          }
          await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        };
        components.createButton({
          label: translate('tag_generate.confirm_allow'),
          run: press(true),
          style: MessageComponentButtonStyles.SUCCESS,
        });
        components.createButton({
          label: translate('tag_generate.confirm_cancel'),
          run: press(false),
          style: MessageComponentButtonStyles.SECONDARY,
        });

        const endsAt = Math.round((startedAt + AI_CONFIRM_TIMEOUT) / 1000);
        const content = [
          `**${translate('tag_generate.confirm_title')}**`,
          Markup.codeblock(call),
          `-# ${translate((reason === TagFormatter.AIConfirmReasons.UNTRUSTED) ? 'tag_generate.confirm_untrusted' : 'tag_generate.confirm_destructive')}`,
          `-# ${translate('tag_generate.confirm_footer', {time: `<t:${endsAt}:R>`, user: `<@${context.userId}>`})}`,
        ].join('\n');
        // nothing to press if the reply can't be edited, the run goes on as if they cancelled. in the display setting like
        // the thinking reply it's on, so it stays an edit
        displayReply(context, {components, description: content}, {replyTo}).catch((error) => {
          if (!answered) {
            answered = true;
            components.clear();
            reject(error);
          }
        });
      });
    } finally {
      onWait(Date.now() - startedAt);
    }
  });
}


// what the api's static check found, and whether the reply was repaired because of it
function formatCheckDebug(response: RestResponsesRaw.GenerateTag): Array<string> {
  const lines: Array<string> = [];
  if (response.output_kind) {
    lines.push('Output Kind: ' + response.output_kind);
  }
  if (response.repair_errors && response.repair_errors.length) {
    lines.push(`Repair: ${(response.repaired) ? 'used' : 'discarded'} (first reply had ${response.repair_errors.length} problem(s))`);
  }
  if (response.check_errors && response.check_errors.length) {
    lines.push('Check Problems: ' + response.check_errors.join('; '));
  }
  return lines;
}


// the visible parts of an embed as plain text, instead of the whole json with its proxy urls and colors
function embedToText(embed: any): string {
  const lines: Array<string> = [];
  if (embed.author && embed.author.name) {
    lines.push(`Author: ${embed.author.name}`);
  }
  if (embed.title) {
    lines.push(`Title: ${embed.title}`);
  }
  if (embed.url) {
    lines.push(`Url: ${embed.url}`);
  }
  if (embed.description) {
    lines.push(embed.description);
  }
  // a collection turns into an array or an object of fields depending on how it was serialized
  const fields = Array.isArray(embed.fields) ? embed.fields : Object.values(embed.fields || {});
  for (let field of fields as Array<any>) {
    lines.push(`${field.name}: ${field.value}`);
  }
  for (let key of ['image', 'thumbnail', 'video']) {
    if (embed[key] && embed[key].url) {
      lines.push(`${key[0].toUpperCase()}${key.slice(1)}: ${embed[key].url}`);
    }
  }
  if (embed.footer && embed.footer.text) {
    lines.push(`Footer: ${embed.footer.text}`);
  }
  return lines.join('\n').trim();
}


const COMPONENT_TEXT_KEYS = ['content', 'label', 'title', 'description', 'placeholder', 'url'];

// every piece of text in a components v2 tree (text displays, button labels, media urls), in order
function componentsToText(value: any, lines: Array<string> = []): string {
  if (Array.isArray(value)) {
    for (let item of value) {
      componentsToText(item, lines);
    }
  } else if (value && typeof(value) === 'object') {
    for (let key of COMPONENT_TEXT_KEYS) {
      if (typeof(value[key]) === 'string' && value[key] && lines[lines.length - 1] !== value[key]) {
        lines.push(value[key]);
      }
    }
    for (let key in value) {
      if (value[key] && typeof(value[key]) === 'object') {
        componentsToText(value[key], lines);
      }
    }
  }
  return lines.join('\n').trim();
}


function isTextContentType(contentType?: null | string): boolean {
  return !!contentType && (contentType.startsWith('text/') || contentType.startsWith('application/json'));
}


function findMediaForAI(message: Structures.Message): null | {isText: boolean, url: string} {
  // `{}` turns off text files, so anything only found without it is a text file
  const url = findMediaUrlInMessage(message, null, {});
  if (url) {
    return {isText: false, url};
  }
  const textUrl = findMediaUrlInMessage(message);
  if (textUrl) {
    return {isText: true, url: textUrl};
  }
  return null;
}


// the message an earlier NotSoAI turn got its media from: the command message NotSoAI's reply answered, or the first
// media going up from there (like that turn's own lookup did). null when it had none
async function findEarlierMediaLink(
  context: Command.Context | Interaction.InteractionContext,
  aiReply: Structures.Message,
): Promise<null | string> {
  let message = aiReply;
  for (let chain = 0; chain < 5 && message.messageReference && message.messageReference.messageId; chain++) {
    const { messageReference } = message;
    try {
      message = messageReference.message || await context.rest.fetchMessage(
        messageReference.channelId,
        messageReference.messageId!,
      );
    } catch(error) {
      return null;
    }
    const media = findMediaForAI(message);
    if (media && !media.isText) {
      return message.jumpLink;
    }
  }
  return null;
}


// a file uploaded with the message, not something found through an embed, a component or a forward
function isOwnAttachment(message: Structures.Message, url: string): boolean {
  for (let attachment of message.attachments.values()) {
    if (url === attachment.url || (attachment.proxyUrl && url.startsWith(attachment.proxyUrl))) {
      return true;
    }
  }
  return false;
}


async function fetchTextForAI(
  context: Command.Context | Interaction.InteractionContext,
  url: string,
): Promise<string> {
  try {
    const response = await utilitiesFetchText(context, {maxFileSize: context.maxAttachmentSize, url});
    const text = await response.text();
    if (MAX_TEXT_FILE_LENGTH < text.length) {
      return `${JSON.stringify(text.slice(0, MAX_TEXT_FILE_LENGTH))} (Truncated from ${text.length} characters)`;
    }
    return JSON.stringify(text);
  } catch(error) {
    return (error.response) ? `Fetching Errored due to status code ${error.response.statusCode}` : 'Unable to fetch data';
  }
}


export async function getAIPersonality(
  context: Command.Context | Interaction.InteractionContext,
  prompt?: string,
  personalityPreference?: string,
): Promise<[string | null | undefined, string | undefined, string | undefined]> {
  let personality: string | null | undefined;

  let serverPersonality: string | undefined;
  let userPersonality: string | undefined;

  {
    // both at once, and no server's settings to fetch in dms (it used to ask the api for guild `undefined`)
    const [ settings, guildSettings ] = await Promise.all([
      UserSettingsStore.getOrFetch(context, context.userId),
      (context.guildId) ? GuildSettingsStore.getOrFetch(context, context.guildId) : null,
    ]);
    if (settings && settings.ml_llm_personality) {
      userPersonality = settings.ml_llm_personality;
    }
    if (guildSettings && guildSettings.settings.mlLLMPersonality) {
      serverPersonality = guildSettings.settings.mlLLMPersonality;
    }
  }

  switch (personalityPreference) {
    case TagGenerationPersonalityPreferences.DEFAULT: {
      personality = null;
    }; break;
    case TagGenerationPersonalityPreferences.SERVER: {
      personality = serverPersonality || null;
    }; break;
    case TagGenerationPersonalityPreferences.USER: {
      personality = userPersonality || null;
    }; break;
    case TagGenerationPersonalityPreferences.AUTOMATIC:
    default: {
      personality = userPersonality || serverPersonality || null;
    };
  }

  if (personality && personality.includes('{') && personality.includes('}')) {
    const parsedTag = await TagFormatter.parse(context, personality, prompt, {
      defaultPersonality: TAG_GENERATION_PERSONALITY_DEFAULT,
      personality: personality || TAG_GENERATION_PERSONALITY_DEFAULT,
      serverPersonality,
      userPersonality,
    } as any, {} as any, {
      MAX_AI_EXECUTIONS: 0,
      MAX_ATTACHMENTS: 0,
    });
    personality = parsedTag.text.slice(0, 1024);
  }

  return [ personality, serverPersonality, userPersonality ];
}

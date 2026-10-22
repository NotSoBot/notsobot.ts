import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import CommandResponsesStore from '../../../stores/commandresponses';
import GuildSettingsStore from '../../../stores/guildsettings';
import UserSettingsStore from '../../../stores/usersettings';

import {
  fetchCommandsResponses,
  generateTag,
  mediaAIVToolsAnalyze,
  putGeneratedTagError,
  utilitiesFetchText,
} from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { TagGenerationPersonalityPreferences, TAG_GENERATION_PERSONALITY_DEFAULT } from '../../../constants';
import { captureError } from '../../../sentry';
import {
  Paginator,
  Parameters,
  TagFormatter,
  checkNSFW,
  editOrReply,
  findMediaUrlInMessage,
  timeLimitParts,
} from '../../../utils';

import { Translator, getTranslator, randomAIThinkingText } from '../../i18n';

import { THINKING_REPLY_AFTER, ThinkingReply, createTagMessage, tagTimeLimitText } from './tag.show';


export const COMMAND_ID = 'tag.generate';

export const MAX_TEXT_FILE_LENGTH = 20000;

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
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // "premium plus ai · ai is ruminating" while NotSoAI writes, then the tag's countdown once its tagscript runs
  const thinking = new ThinkingReply(context, (translate) => aiWritingText(context, translate));
  try {
    return await generateAndRunTag(context, args, thinking);
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
) {
  const urls: Array<string> = [];
  const promptExtra: Array<string> = [];
  // replying to NotSoAI continues that conversation, the api sends its earlier turns (with the code it wrote)
  let parentId: null | string = null;
  if (context instanceof Command.Context) {
    // only the media from the command message itself and the first media found going up the reply chain
    const current = findMediaForAI(context.message);
    const currentText = (current && current.isText) ? await fetchTextForAI(context, current.url) : null;
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
          promptExtra.push([
            `Message Reply Context ${chain}`,
            '-> Your previous reply in this conversation',
            (replyText) ? `-> Text File: ${replyText}` : null,
            (mediaIsFromHere && !reply!.isText) ? '-> Media is from here' : null,
          ].filter(Boolean).join('\n'));
          break;
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

  const [ personality, serverPersonality, userPersonality ] = await getAIPersonality(
    context, args.prompt, args.personalityPreference,
  );

  const now = Date.now();
  const response = await generateTag(context, {
    memory: true,
    model: args.model,
    parentId: parentId || undefined,
    personality,
    personalityPreference: args.personalityPreference,
    prompt: [args.prompt, ...promptExtra].join('\n'),
    urls,
  });
  if (response.id) {
    // saved with the command's response (`onFinally`), so a reply to it can continue this conversation
    context.metadata = Object.assign({}, context.metadata, {llmResponseId: response.id});
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

  const startedAt = Date.now();
  // most generated tagscript is done right away, only switch to its countdown once it's actually taking a while
  thinking.setStatus((translate) => tagTimeLimitText(context, translate, startedAt), THINKING_REPLY_AFTER);
  try {
    const parsedTag = await TagFormatter.parse(context, response.text, '', {
      defaultPersonality: TAG_GENERATION_PERSONALITY_DEFAULT,
      personality: personality || TAG_GENERATION_PERSONALITY_DEFAULT,
      serverPersonality,
      userPersonality,
      // NotSoAI wrote this, unlocks the NotSoAI-only functions
      [TagFormatter.PrivateVariables.IS_FROM_AI]: 1,
      [TagFormatter.PrivateVariables.SETTINGS]: {
        [TagFormatter.TagSettings.AI_MODEL]: args.model,
      },
    } as any);

    // always say when NotSoAI changed what it remembers, instead of trusting it to mention it
    const memoryChanges = TagFormatter.getAIMemoryChanges(parsedTag);
    if (memoryChanges) {
      const { translate } = await getTranslator(context);
      const receipt = (memoryChanges.added && !memoryChanges.changed) ? translate('tag_generate.memory_saved') : translate('tag_generate.memory_updated');
      parsedTag.text = [parsedTag.text.trimEnd(), `-# 🧠 ${receipt}`].join('\n');
    }
    await thinking.stop();
    return await createTagMessage(context, parsedTag);
  } catch(error) {
    await thinking.stop();
    if (response.id) {
      try {
        await putGeneratedTagError(context, response.id, {error: error.message.slice(0, 6000)});
      } catch(e) {
        
      }
    }

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

    return editOrReply(context, {
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
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings && settings.ml_llm_personality) {
      userPersonality = settings.ml_llm_personality;
    }
  }

  {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
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

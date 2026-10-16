import * as Sentry from '@sentry/node';

import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import UserSettingsStore from '../../../stores/usersettings';

import { generateTag, mediaAIVToolsAnalyze, putGeneratedTagError, utilitiesFetchText } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { TagGenerationPersonalityPreferences, TAG_GENERATION_PERSONALITY_DEFAULT } from '../../../constants';
import { Paginator, Parameters, TagFormatter, checkNSFW, editOrReply, findMediaUrlInMessage } from '../../../utils';

import { createTagMessage } from './tag.show';


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
  const urls: Array<string> = [];
  const promptExtra: Array<string> = [];
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

        const content: Array<string> = [];
        if (replyText) {
          content.push(`-> Text File: ${replyText}`);
        }
        if (message.content) {
          content.push(`-> Content: ${JSON.stringify(message.content)}`);
        }
        if (message.components.length) {
          // get content from components v2
          content.push(`-> Components: ${JSON.stringify(message.components)}`);
        }
        if (message.embeds.length) {
          const filteredEmbeds: Array<string> = [];
          for (let [embedId, embed] of message.embeds) {
            const filteredEmbed = JSON.parse(JSON.stringify(embed));
            if (filteredEmbed.author) {
              delete filteredEmbed.author.proxy_icon_url;
            }
            if (filteredEmbed.footer) {
              delete filteredEmbed.footer.proxy_icon_url;
            }
            if (filteredEmbed.image) {
              delete filteredEmbed.image.proxy_url;
            }
            if (filteredEmbed.thumbnail) {
              delete filteredEmbed.thumbnail.proxy_url;
            }
            if (filteredEmbed.video) {
              delete filteredEmbed.video.proxy_url;
            }
            filteredEmbeds.push(filteredEmbed);
          }
          content.push(`-> Embeds: ${JSON.stringify(filteredEmbeds)}`);
          // content.push(`-> Embeds: ${JSON.stringify(message.embeds)}`);
          /*
          for (let [embedId, embed] of message.embeds) {
            const description: Array<string> = [];
            if (embed.title) {
              description.push(embed.title);
            }
            if (embed.description) {
              let value = embed.description;
              if (value.startsWith('```') && value.endsWith('```')) {
                value = value.slice(3, -3).trim();
                const newLineIndex = value.indexOf('\n');
                if (newLineIndex !== -1) {
                  value = value.slice(newLineIndex).trim();
                }
              }
              description.push(value);
            }
            if (embed.fields) {
              for (let [fieldId, field] of embed.fields) {
                description.push(`${field.name}: ${field.value}`);
              }
            }
            if (embed.footer && embed.footer.text.length) {
              description.push(embed.footer.text);
            }
            const text = description.filter(Boolean).join('\n').trim();
            if (text) {
              content.push(text);
              break;
            }
          }
          */
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
    model: args.model,
    personality,
    personalityPreference: args.personalityPreference,
    prompt: [args.prompt, ...promptExtra].join('\n'),
    urls,
  });
  if (args.debugFull) {
    return editOrReply(context, {
      content: [
        'Model: ' + response.model,
        'Prompt Complexity Level: ' + response.prompt_complexity_level,
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
        'Took: ' + String(Date.now() - now),
      ].join('\n'),
      file: {filename: 'response.txt', value: response.text},
    });
  }

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
    return await createTagMessage(context, parsedTag);
  } catch(error) {
    if (response.id) {
      try {
        await putGeneratedTagError(context, response.id, {error: error.message.slice(0, 6000)});
      } catch(e) {
        
      }
    }

    Sentry.withScope((scope) => {
      scope.setUser({ id: context.userId });
      scope.setTags({
        channelId: context.channelId,
        guildId: context.guildId,
        model: response.model,
        ...response.usage,
      });
      scope.setExtras({
        prompt: args.prompt,
        prompt_complexity_level: response.prompt_complexity_level,
        result: response.text,
        took: Date.now() - now,
      });
      Sentry.captureException(error);
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

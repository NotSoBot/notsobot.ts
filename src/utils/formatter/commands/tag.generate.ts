import * as Sentry from '@sentry/node';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import UserSettingsStore from '../../../stores/usersettings';

import { generateTag, mediaAIVToolsAnalyze, putGeneratedTagError } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { TagGenerationPersonalityPreferences } from '../../../constants';
import { Paginator, Parameters, TagFormatter, checkNSFW, editOrReply, findMediaUrlInMessage } from '../../../utils';

import { createTagMessage } from './tag.show';


export const COMMAND_ID = 'tag.generate';

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
    let url = findMediaUrlInMessage(context.message);

    const { messageReference } = context.message;
    if (messageReference && messageReference.messageId) {
      const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
      if (!url) {
        url = findMediaUrlInMessage(message);
      }

      const content: Array<string> = [];
      if (message.content) {
        content.push(message.content);
      }
      if (message.embeds.length) {
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
      }

      const replyText = content.filter(Boolean).join('\n\n').trim();
      if (replyText) {
        promptExtra.push(`Message Reply Context: ${replyText}`);
      }
    }

    if (url) {
      urls.push(url);
    }
  } else if (context instanceof Interaction.InteractionContext) {
    if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments) {
      for (let [attachmentId, attachment] of context.data.resolved.attachments) {
        urls.push(attachment.url);
      }
    }
  }

  let personality: string | null | undefined;

  const defaultPersonality = 'Make sure to answer extremely informally and to use a lot of lowercase and some shortened words and do not use any emojis or terms like "my dude", "bruh", "bestie", "fr", "like", "yo".';
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

  switch (args.personalityPreference) {
    case TagGenerationPersonalityPreferences.DEFAULT: {
      personality = null;
    }; break;
    case TagGenerationPersonalityPreferences.GUILD: {
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
    const parsedTag = await TagFormatter.parse(context, personality, args.prompt, {
      defaultPersonality,
      personality: personality || defaultPersonality,
      serverPersonality,
      userPersonality,
    } as any, {} as any, {
      MAX_AI_EXECUTIONS: 0,
      MAX_ATTACHMENTS: 0,
    });
    personality = parsedTag.text.slice(0, 1024);
  }

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
        `Token Count: (Input: ${response.usage.input_tokens}) (Output: ${response.usage.output_tokens})`,
        `Token Count Cached: (Input: ${response.usage.cache_creation_input_tokens + response.usage.cache_read_input_tokens})`,
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
      defaultPersonality,
      personality: personality || defaultPersonality,
      serverPersonality,
      userPersonality,
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

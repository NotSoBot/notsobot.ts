import * as Sentry from '@sentry/node';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { generateTag, mediaAIVToolsAnalyze } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { Parameters, TagFormatter, checkNSFW, editOrReply, findMediaUrlInMessage } from '../../../utils';


export const COMMAND_ID = 'tag.generate';

export interface CommandArgsBefore {
  debug?: boolean,
  debugFull?: boolean,
  model?: string,
  prompt: string,
}

export interface CommandArgs {
  debug?: boolean,
  debugFull?: boolean,
  model?: string,
  prompt: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const promptExtra: Array<string> = [];
  {
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
        const response = await mediaAIVToolsAnalyze(context, {url});
        if (response.interrogation || response.ocr || response.songs.length || response.transcription.length) {
          promptExtra.push(`Message Reply Media Analyzation: ${JSON.stringify(response)}`);
        }
      }
      promptExtra.reverse(); // for prompt caching, the analyzation is more likely to stay the same
    }
  }

  const now = Date.now();
  const response = await generateTag(context, {
    model: args.model,
    prompt: args.prompt,
    promptExtra: promptExtra,
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
    const parsedTag = await TagFormatter.parse(context, response.text, '');
  
    const content = parsedTag.text.trim().slice(0, 2000).trim();
    const options: Command.EditOrReply = {content};
    if (parsedTag.embeds.length) {
      // add checks for embed lengths
      options.embeds = parsedTag.embeds.slice(0, 10);
    }
  
    if (parsedTag.files.length) {
      options.files = parsedTag.files.slice(0, 10).map((file) => {
        return {
          description: file.description,
          filename: file.filename,
          hasSpoiler: file.spoiler,
          value: file.buffer,
        };
      });
    }

    if (options.content) {
      const [ isAwfulNSFW ] = await checkNSFW(context, options.content);
      if (isAwfulNSFW) {
        options.content = 'i love cats';
      }
    }

    if (!content.length && !parsedTag.embeds.length && !parsedTag.files.length) {
      options.content = 'No content returned';
    }

    context.metadata = Object.assign({}, context.metadata, {parsedTag});

    return editOrReply(context, options);
  } catch(error) {
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

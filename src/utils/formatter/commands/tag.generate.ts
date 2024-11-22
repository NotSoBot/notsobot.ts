import * as Sentry from '@sentry/node';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { generateTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { Parameters, TagFormatter, checkNSFW, editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.generate';

export interface CommandArgsBefore {
  debug?: boolean,
  model?: string,
  prompt: string,
}

export interface CommandArgs {
  debug?: boolean,
  model?: string,
  prompt: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  {
    const replyText = await Parameters.targetText('', context);
    if (replyText) {
      args.prompt = [args.prompt, `Message Reply Context: ${replyText}`].join('\n');
    }
  }
  const now = Date.now();
  const response = await generateTag(context, {
    model: args.model,
    prompt: args.prompt,
  });
  if (args.debug) {
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

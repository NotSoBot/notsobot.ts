import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { createTagUse, editTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { Paginator, TagFormatter, editOrReply } from '../../../utils';

import { OPENAI_API_KEY } from '../../../../config.json';


export const COMMAND_ID = 'tag.show';

export interface CommandArgsBefore {
  arguments?: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  arguments?: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // parse it
  const { tag } = args;
  context.metadata = Object.assign({}, context.metadata, {tag});
  const tagContent = (tag.reference_tag) ? tag.reference_tag.content : tag.content;
  const parsedTag = await TagFormatter.parse(context, tagContent, args.arguments);
  context.metadata = Object.assign({}, context.metadata, {parsedTag});

  if (parsedTag.pages.length) {
    const paginator = new Paginator(context, {
      pages: parsedTag.pages.map((x) => x.embed),
    })
    return await paginator.start();
  }

  const content = parsedTag.text.trim().slice(0, 2000).trim();
  const options: Command.EditOrReply = {content};
  if (parsedTag.embeds.length) {
    // add checks for embed lengths
    options.embeds = parsedTag.embeds.slice(0, 10);
  }

  if (parsedTag.files.length) {
    options.files = parsedTag.files.slice(0, 10).map((file) => {
      if (file.waveform) {
        options.flags = MessageFlags.IS_VOICE_MESSAGE;
      }
      return {
        description: file.description,
        durationSecs: file.durationSecs,
        filename: file.filename,
        hasSpoiler: file.spoiler,
        waveform: file.waveform,
        value: file.buffer,
      };
    });
  }

  await maybeCheckNSFW(context, tag, options);
  if (!content.length && !parsedTag.embeds.length && !parsedTag.files.length) {
    options.content = 'Tag returned no content';
  }

  if (options.flags && (content.length || parsedTag.embeds.length || parsedTag.files.length !== 1)) {
    options.flags = undefined;
  }

  return editOrReply(context, options);
}



export async function maybeCheckNSFW(
  context: Command.Context | Interaction.InteractionContext,
  tag: RestResponsesRaw.Tag,
  options: Command.EditOrReply,
): Promise<void> {
  if (options.content) {
    const [ isAwfulNSFW ] = await checkNSFW(context, options.content);
    if (isAwfulNSFW) {
      options.content = 'i love cats';
    }
  }
}


import OpenAI from 'openai';


const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});


const CATEGORIES_TO_CHECK_ALL = ['harassment', 'hate'];
const CATEGORIES_TO_CHECK_SOME = ['harassment/threatening', 'hate/threatening', 'sexual/minors'];

export async function checkNSFW(
  context: Command.Context | Interaction.InteractionContext,
  content: string,
): Promise<[boolean, any]> {
  if (!OPENAI_API_KEY) {
    return [false, null];
  }

  const response = await client.moderations.create({
    model: 'omni-moderation-latest',
    input: [
      {type: 'text', text: content},
    ],
  });
  for (let result of response.results) {
    let isAwfulNSFW = CATEGORIES_TO_CHECK_ALL.every((category) => (result.categories as any)[category]);
    if (isAwfulNSFW) {
      return [true, response];
    }
    isAwfulNSFW = CATEGORIES_TO_CHECK_SOME.some((category) => (result.categories as any)[category]);
    if (isAwfulNSFW) {
      return [true, response];
    }
  }
  return [false, response];
}


export async function increaseUsage(
  context: Command.Context | Interaction.InteractionContext,
  tag: RestResponsesRaw.Tag,
) {
  let timestamp: number;
  if (context instanceof Interaction.InteractionContext) {
    timestamp = context.interaction.createdAtUnix;
  } else {
    timestamp = context.message.editedAtUnix || context.message.createdAtUnix;
  }

  try {
    await createTagUse(context, tag.id, {
      serverId: context.guildId || context.channelId,
      timestamp,
      userId: context.userId,
    });
  } catch(e) {

  }

  const tagId = (tag.reference_tag) ? tag.reference_tag.id : tag.id;

  const replacementContent = context?.metadata?.parsedTag?.replacement;
  if (replacementContent) {
    try {
      // update tag without updating the edit time
      await editTag(context, tagId, {
        content: replacementContent,
        isUrlRefresh: true,
      });
    } catch(e) {

    }
  }
}

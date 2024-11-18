import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import TagCustomCommandStore from '../../../stores/tagcustomcommands';

import { createTagUse, editTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { Paginator, TagFormatter, checkNSFW, editOrReply } from '../../../utils';


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
  await increaseUsage(context, tag);

  context.metadata = Object.assign({}, context.metadata, {tag});
  const tagContent = (tag.reference_tag) ? tag.reference_tag.content : tag.content;
  const parsedTag = await TagFormatter.parse(context, tagContent, args.arguments);

  context.metadata = Object.assign({}, context.metadata, {parsedTag});
  await maybeReplaceContent(context, tag);

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
    const response = await createTagUse(context, tag.id, {
      serverId: context.guildId || context.channelId,
      timestamp,
      userId: context.userId,
    });
    tag.last_used = response.last_used;
    // update TagCustomCommandStore using server_id or user.id, problem is that its only for this cluster
  } catch(e) {

  }
}


export async function maybeReplaceContent(
  context: Command.Context | Interaction.InteractionContext,
  tag: RestResponsesRaw.Tag,
) {
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

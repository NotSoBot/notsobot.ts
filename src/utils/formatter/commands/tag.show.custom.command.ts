import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { TagCustomCommandStored } from '../../../stores/tagcustomcommands';

import { RestResponsesRaw } from '../../../api/types';
import { Paginator, TagFormatter, editOrReply } from '../../../utils';

import { generatePages, increaseUsage, maybeCheckNSFW, maybeReplaceContent } from './tag.show';



export const COMMAND_ID = 'tag.show.custom.command';

export interface CommandArgsBefore {
  arguments?: string,
  tag: false | null | RestResponsesRaw.Tag,
  text: string,
}

export interface CommandArgs {
  arguments?: string,
  tag: RestResponsesRaw.Tag,
  text: string,
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
    const pages = generatePages(context, parsedTag);
    const paginator = new Paginator(context, {pages});
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


export function findTagFromText(text: string, tags: TagCustomCommandStored): RestResponsesRaw.Tag | null {
  const insensitive = text.trim().toLowerCase();
  for (let tag of tags.sort((x, y) => y.name.length - x.name.length)) {
    if (
      (insensitive.length === tag.name.length && insensitive === tag.name) ||
      insensitive.startsWith(`${tag.name} `)
    ) {
      return tag;
    }
  }
  return null;
}

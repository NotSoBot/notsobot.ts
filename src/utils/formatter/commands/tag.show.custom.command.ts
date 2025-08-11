import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { TagCustomCommandStored } from '../../../stores/tagcustomcommands';

import { RestResponsesRaw } from '../../../api/types';
import { TagFormatter } from '../../../utils';

import { createTagMessage, increaseUsage, maybeReplaceContent } from './tag.show';



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
  return await createTagMessage(context, parsedTag);
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

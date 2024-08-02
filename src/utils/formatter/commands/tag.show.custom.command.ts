import { Command, Interaction } from 'detritus-client';

import { TagCustomCommandStored } from '../../../stores/tagcustomcommands';

import { RestResponsesRaw } from '../../../api/types';
import { TagFormatter, editOrReply } from '../../../utils';


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
  context.metadata = Object.assign({}, context.metadata, {tag});
  const tagContent = (tag.reference_tag) ? tag.reference_tag.content : tag.content;
  const parsedTag = await TagFormatter.parse(context, tagContent, args.arguments);

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

  if (!content.length && !parsedTag.embeds.length && !parsedTag.files.length) {
    options.content = 'Tag returned no content';
  }

  context.metadata = Object.assign({}, context.metadata, {parsedTag});

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

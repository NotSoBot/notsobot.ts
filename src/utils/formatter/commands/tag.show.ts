import { Command, Interaction } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { TagFormatter, editOrReply } from '../../../utils';


export interface CommandArgs {
  arguments: Array<string>,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // parse it
  const parsedTag = await TagFormatter.parse(context, args.tag.content, args.arguments);

  const options: Command.EditOrReply = {content: parsedTag.text.slice(0, 4000)};
  if (parsedTag.files.length) {
    options.files = parsedTag.files.map((file) => {
      return {filename: file.filename, hasSpoiler: file.spoiler, value: file.buffer};
    });
  }
  if (!parsedTag.text.length && !parsedTag.files.length) {
    options.content = 'tag returned no content lmao';
  }
  return editOrReply(context, options);
}

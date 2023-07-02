import { Command, Interaction } from 'detritus-client';

import { createTagUse } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { TagFormatter, editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.show';

export interface CommandArgs {
  arguments?: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // parse it
  context.metadata = Object.assign({}, context.metadata, {tag: args.tag});
  const parsedTag = await TagFormatter.parse(context, args.tag.content, args.arguments);

  const options: Command.EditOrReply = {content: parsedTag.text.slice(0, 2000)};
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

  if (!parsedTag.text.length && !parsedTag.embeds.length && !parsedTag.files.length) {
    options.content = 'Tag returned no content';
  }

  return editOrReply(context, options);
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
      timestamp,
      userId: context.userId,
    });
  } catch(e) {

  }
}

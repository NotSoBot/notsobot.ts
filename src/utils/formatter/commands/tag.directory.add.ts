import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { putTagsDirectoryTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { BooleanEmojis } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.directory.add';

export interface CommandArgsBefore {
  description?: string,
  tag: false | null | RestResponsesRaw.Tag,
  title?: string,
}

export interface CommandArgs {
  description?: string,
  tag: RestResponsesRaw.Tag,
  title?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  if (args.tag.is_on_directory) {
    // todo: get rid of this and instead add an update message
    return editOrReply(context, `${BooleanEmojis.WARNING} Tag is already on directory.`)
  }

  const directory = await putTagsDirectoryTag(context, args.tag.id, {
    description: args.description,
    title: args.title,
  });

  return editOrReply(context, `Ok, added tag ${Markup.codestring(args.tag.id)} to the Tag Directory.`);
}

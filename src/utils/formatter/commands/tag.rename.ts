import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.rename';

export interface CommandArgsBefore {
  name: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  name: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  if (args.tag.name === args.name) {
    return editOrReply(context, 'ok');
  }

  const tag = await editTag(context, args.tag.id, {name: args.name});
  return editOrReply(context, `Successfully renamed tag ${Markup.codestring(args.tag.name)} to ${Markup.codestring(tag.name)}`);
}

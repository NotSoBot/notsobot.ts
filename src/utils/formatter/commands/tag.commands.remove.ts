import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import TagCustomCommandsStore from '../../../stores/tagcustomcommands';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.commandify.disable';

export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const tag = await editTag(context, args.tag.id, {isCommand: false});

  const payloadId = context.guildId || context.userId;
  if (TagCustomCommandsStore.has(payloadId)) {
    TagCustomCommandsStore.get(payloadId)!.delete(tag.id);
  }

  return editOrReply(context, `Successfully removed the tag ${Markup.codestring(tag.name)} from the custom command list`);
}

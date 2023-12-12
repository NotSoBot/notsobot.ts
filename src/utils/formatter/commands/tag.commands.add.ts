import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import TagCustomCommandsStore from '../../../stores/tagcustomcommands';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.commandify.enable';

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
  const tag = await editTag(context, args.tag.id, {isCommand: true});

  const payloadId = context.guildId || context.userId;
  TagCustomCommandsStore.insertSingle(payloadId, tag);

  return editOrReply(context, `Successfully made ${Markup.codestring(tag.name)} a custom command`);
}

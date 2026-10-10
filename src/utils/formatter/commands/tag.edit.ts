import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { putTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.edit';

export interface CommandArgsBefore {
  content: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  content: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const tag = await putTag(context, {
    content: args.content,
    name: args.tag.name,
    serverId: context.guildId || context.channelId,
  });
  return editOrReply(context, `Successfully edited tag ${Markup.codestring(tag.name)}`);
}

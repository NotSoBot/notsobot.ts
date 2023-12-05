import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTag, putTag } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.create';

export interface CommandArgs {
  content: string,
  tag: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const serverId = context.guildId || context.channelId;

  let isEdit = false;
  try {
    const tag = await fetchTag(context, {name: args.tag, serverId});
    if (!tag.global) {
      if (tag.user.id !== context.userId) {
        return editOrReply(context, '⚠ Tag already exists in this server!');
      }
    }
    isEdit = true;
  } catch(error) {
    if (!error.response || error.response.statusCode !== 404) {
      throw error;
    }
  }

  const tag = await putTag(context, {content: args.content, name: args.tag, serverId});

  let text: string;
  if (isEdit) {
    text = `Successfully edited tag ${Markup.codestring(tag.name)}`;
  } else {
    text = `Successfully created tag ${Markup.codestring(tag.name)}`;
  }
  return editOrReply(context, text);
}

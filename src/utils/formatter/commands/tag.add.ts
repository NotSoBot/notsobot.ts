import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';

import { fetchTag, putTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { BooleanEmojis } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.add';

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
  const tagName = args.name || args.tag.name;

  if (isFromInteraction && !context.hasServerPermissions && context.guildId && context.guildPartial) {
    // create server in database
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  }

  const serverId = context.guildId || context.channelId;
  try {
    const oldTag = await fetchTag(context, {name: tagName, serverId});
    if (oldTag.user.id !== context.userId) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Tag already exists in this server and you do not own it!`);
    }
    if (oldTag.content) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Cannot edit a regular tag to be an alias tag.`)
    }
  } catch(error) {
    
  }

  const tag = await putTag(context, {
    name: tagName,
    referenceTagId: args.tag.id,
    serverId,
  });

  let message = `Ok, added tag ${Markup.codestring(args.tag.name)} from your DMs`;
  if (args.tag.name !== tag.name) {
    message = `${message} as ${Markup.codestring(tag.name)}`;
  }
  return editOrReply(context, `${message} to this server.`);
}

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';

import { fetchTag, putTag } from '../../../api';
import { BooleanEmojis } from '../../../constants';
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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const serverId = context.guildId || context.channelId;

  let isEdit = false;
  try {
    const tag = await fetchTag(context, {name: args.tag, serverId});
    if (!tag.global) {
      if (tag.user.id !== context.userId) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Tag already exists in this server!`);
      }
    }
    isEdit = true;
  } catch(error) {
    if (!error.response || error.response.statusCode !== 404) {
      throw error;
    }
  }

  if (isFromInteraction && !context.hasServerPermissions && context.guildId && context.guildPartial) {
    // create server in database
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
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

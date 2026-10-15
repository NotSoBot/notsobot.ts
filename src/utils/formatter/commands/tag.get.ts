import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import UserStore from '../../../stores/users';
import { getTranslator } from '../../i18n';

import { fetchTag, putTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';


// `tag get`: adds a tag from the tag directory or your DMs (as an alias) to this server/DM
// keeps its old id from when it was `tag add`, so existing command blocklists/allowlists still apply
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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const tagName = args.name || args.tag.name;

  if (isFromInteraction && !context.isFromGuildInstall && context.guildId && context.guildPartial) {
    // create server in database
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  }

  const serverId = context.guildId || context.channelId;
  if (args.tag.server_id === serverId) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.tag_is_already_here')}`});
  }

  try {
    const oldTag = await fetchTag(context, {name: tagName, serverId});
    if (oldTag.user.id !== context.userId) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.tag_already_exists_in_this_server_and')}`});
    }
    if (oldTag.content) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.cannot_edit_a_regular_tag_to_be')}`})
    }
  } catch(error) {
    
  }

  const tag = await putTag(context, {
    name: tagName,
    referenceTagId: args.tag.id,
    serverId,
  });

  let message = (args.tag.is_on_directory) ?
    translate('tag_get.ok_added_tag_from_the_tag_directory', {name: Markup.codestring(args.tag.name)}) :
    translate('tag_get.ok_added_tag_from_your_dms', {name: Markup.codestring(args.tag.name)});
  if (args.tag.name !== tag.name) {
    message = `${message} as ${Markup.codestring(tag.name)}`;
  }

  if (context.guildId) {
    return displayReply(context, {description: translate('tag_get.to_this_server', {message})});
  }
  const user = await UserStore.getOrFetch(context, context.userId);
  if (user && user.channelId === context.channelId) {
    return displayReply(context, {description: translate('tag_get.to_your_dms', {message})});
  }
  return displayReply(context, {description: translate('tag_get.to_this_channel', {message})});
}

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import { fetchTag, putTag } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'tag.create';

export interface CommandArgs {
  content: string,
  tag: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const serverId = context.guildId || context.channelId;

  let isEdit = false;
  try {
    const tag = await fetchTag(context, {name: args.tag, serverId});
    if (!tag.global) {
      if (tag.user.id !== context.userId) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_create.tag_already_exists_in_this_server')}`});
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
    text = translate('tag_create.successfully_edited_tag', {name: Markup.codestring(tag.name)});
  } else {
    text = translate('tag_create.successfully_created_tag', {name: Markup.codestring(tag.name)});
  }
  return displayReply(context, {description: text});
}

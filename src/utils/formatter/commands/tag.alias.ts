import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import { fetchTag, putTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.alias';

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
  if (args.tag.name === args.name) {
    return editOrReply(context, 'ok');
  }

  if (isFromInteraction && !context.hasServerPermissions && context.guildId && context.guildPartial) {
    // create server in database
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  }

  const serverId = context.guildId || context.channelId;
  try {
    const oldTag = await fetchTag(context, {name: args.name, serverId});
    if (oldTag.user.id !== context.userId) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag_alias.tag_already_exists_in_this_server_and')}`);
    }
    if (oldTag.content) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag_alias.cannot_edit_a_regular_tag_to_be')}`)
    }
  } catch(error) {
    
  }

  const tag = await putTag(context, {
    name: args.name,
    referenceTagId: args.tag.id,
    serverId,
  });

  return editOrReply(
    context,
    translate('tag_alias.ok_created_an_alias_tag_called_for', {name: Markup.codestring(tag.name), name2: Markup.codestring(args.tag.name)}),
  );
}

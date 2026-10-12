import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import UserStore from '../../../stores/users';
import { getTranslator } from '../../i18n';

import { RestResponsesRaw } from '../../../api/types';
import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import {
  createTimestampMomentFromGuild,
  createUserEmbed,
  createUserString,
  editOrReply,
  fetchMemberOrUserById,
} from '../../../utils';


export const COMMAND_ID = 'tag.info';

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const { tag } = args;

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle(tag.name);

  if (tag.reference_tag) {
    if (tag.reference_tag.is_on_directory) {
      // embed.setDescription(`Using a tag from the tag directory. https://notsobot.com/directories/tags/${tag.reference_tag.id}`);
      embed.setDescription([
        translate('tag_info.using_tag_from_the_tag_directory', {reference_tag: Markup.codestring(tag.reference_tag.id)}),
        translate('tag_info.name', {name: Markup.codestring(tag.reference_tag.name)}),
      ].join('\n'));
    } else {
      let message = translate('tag_info.alias_of_tag', {name: Markup.codestring(tag.reference_tag.name)});

      const user = await UserStore.getOrFetch(context, tag.reference_tag.user.id);
      if (user && user.channelId === tag.reference_tag.server_id) {
        const owner = await fetchMemberOrUserById(context, tag.reference_tag.user.id);
        message = translate('tag_info.from_s_dms', {message: message, user: createUserString(tag.reference_tag.user.id, owner, translate('tag.deleted_user'))});
      }

      embed.setDescription(message);
    }
  } else if (tag.is_on_directory) {
    embed.setDescription(translate('tag_info.tag_from_the_tag_directory'));
  } else {
    embed.setDescription(Markup.codeblock(tag.content));
  }

  {
    const description: Array<string> = [];

    {
      const timestamp = createTimestampMomentFromGuild(tag.created, context.guildId);
      description.push(translate('tag_info.created', {timestamp: timestamp.locale(language).fromNow()}));
      description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }
    if (tag.edited) {
      const timestamp = createTimestampMomentFromGuild(tag.edited, context.guildId);
      description.push(translate('tag_info.edited', {timestamp: timestamp.locale(language).fromNow()}));
      description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }

    description.push(translate('tag_info.id', {tag: Markup.codestring(tag.id)}));

    // look through cache, else use the tag object
    description.push(translate('tag_info.nsfw', {nsfw: (tag.nsfw) ? translate('common.yes') : translate('common.no')}));

    {
      const owner = await fetchMemberOrUserById(context, tag.user.id);
      description.push(translate('tag_info.owner', {user: createUserString(tag.user.id, owner, translate('tag.deleted_user'))}));
    }

    description.push(translate('tag_info.uses', {uses: tag.uses.toLocaleString(language)}));

    embed.addField(translate('tag_info.information'), description.join('\n'));
  }

  return editOrReply(context, {embed});
}

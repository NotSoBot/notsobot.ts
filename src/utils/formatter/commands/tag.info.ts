import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserStore from '../../../stores/users';
import { getTranslator } from '../../i18n';

import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import {
  DisplayPayload,
  createTagDirectoryUrl,
  createUserString,
  displayReply,
  fetchMemberOrUserById,
} from '../../../utils';


export const COMMAND_ID = 'tag.info';

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

// absolute date with the relative one after it, discord shows both in the viewer's own timezone and language
function formatTimestamp(value: string): string {
  const date = Date.parse(value);
  return `${Markup.timestamp(date, MarkupTimestampStyles.BOTH_SHORT)} (${Markup.timestamp(date, MarkupTimestampStyles.RELATIVE)})`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const { tag } = args;

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = tag.name;

  if (tag.reference_tag) {
    if (tag.reference_tag.is_on_directory) {
      payload.url = createTagDirectoryUrl(tag.reference_tag.id);
      payload.description = translate('tag_info.using_tag_from_the_tag_directory', {
        reference_tag: Markup.url(Markup.codestring(tag.reference_tag.name), payload.url),
      });
    } else {
      let message = translate('tag_info.alias_of_tag', {name: Markup.codestring(tag.reference_tag.name)});

      const user = await UserStore.getOrFetch(context, tag.reference_tag.user.id);
      if (user && user.channelId === tag.reference_tag.server_id) {
        const owner = await fetchMemberOrUserById(context, tag.reference_tag.user.id);
        message = translate('tag_info.from_s_dms', {message: message, user: createUserString(tag.reference_tag.user.id, owner, translate('tag.deleted_user'))});
      }

      payload.description = message;
    }
  } else if (tag.is_on_directory) {
    payload.url = createTagDirectoryUrl(tag.id);
    payload.description = Markup.url(translate('tag_info.tag_from_the_tag_directory'), payload.url);
  } else {
    payload.description = Markup.codeblock(tag.content);
  }

  {
    const description: Array<string> = [];

    {
      const owner = await fetchMemberOrUserById(context, tag.user.id);
      description.push(translate('tag_info.owner', {user: createUserString(tag.user.id, owner, translate('tag.deleted_user'))}));
    }
    description.push(translate('tag_info.uses', {uses: tag.uses.toLocaleString(language)}));
    description.push(translate('tag_info.created', {timestamp: formatTimestamp(tag.created)}));
    if (tag.edited) {
      description.push(translate('tag_info.edited', {timestamp: formatTimestamp(tag.edited)}));
    }
    description.push(translate('tag_info.nsfw', {nsfw: (tag.nsfw) ? translate('common.yes') : translate('common.no')}));
    description.push(translate('tag_info.id', {tag: Markup.codestring(tag.id)}));

    payload.fields!.push({name: translate('tag_info.information'), value: description.join('\n')});
  }

  return displayReply(context, payload);
}

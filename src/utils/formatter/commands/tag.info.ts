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

// relative only to keep the line short, discord shows the full date when hovering it
function formatTimestamp(value: string): string {
  return Markup.timestamp(Date.parse(value), MarkupTimestampStyles.RELATIVE);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const { tag } = args;

  const payload: DisplayPayload = {};
  payload.color = EmbedColors.DEFAULT;
  payload.title = tag.name;

  // where the tag comes from goes in the footer (under the invoker line), so the content stays right under the title
  // plain text since embed footers don't render markdown, the title links to the directory page instead
  if (tag.reference_tag) {
    if (tag.reference_tag.is_on_directory) {
      payload.url = createTagDirectoryUrl(tag.reference_tag.id);
      payload.footer = translate('tag_info.using_tag_from_the_tag_directory', {reference_tag: tag.reference_tag.name});
    } else {
      let message = translate('tag_info.alias_of_tag', {name: tag.reference_tag.name});

      const user = await UserStore.getOrFetch(context, tag.reference_tag.user.id);
      if (user && user.channelId === tag.reference_tag.server_id) {
        const owner = await fetchMemberOrUserById(context, tag.reference_tag.user.id);
        message = translate('tag_info.from_s_dms', {message: message, user: (owner) ? String(owner) : translate('tag.deleted_user')});
      }

      payload.footer = message;
    }
  } else if (tag.is_on_directory) {
    payload.url = createTagDirectoryUrl(tag.id);
    payload.footer = translate('tag_info.tag_from_the_tag_directory');
  } else {
    payload.description = Markup.codeblock(tag.content);
  }

  // two small lines under the content instead of a labelled line for each, nsfw only shows when it is
  {
    const owner = await fetchMemberOrUserById(context, tag.user.id);
    const first = [
      translate('tag_info.owner', {user: createUserString(tag.user.id, owner, translate('tag.deleted_user'))}),
      translate('tag_info.uses', {uses: tag.uses.toLocaleString(language)}),
    ];
    if (tag.nsfw) {
      first.push(translate('tag_info.nsfw', {nsfw: translate('common.yes')}));
    }

    const second = [translate('tag_info.created', {timestamp: formatTimestamp(tag.created)})];
    if (tag.edited) {
      second.push(translate('tag_info.edited', {timestamp: formatTimestamp(tag.edited)}));
    }
    second.push(translate('tag_info.id', {tag: Markup.codestring(tag.id)}));

    payload.description = [payload.description, `-# ${first.join(' • ')}`, `-# ${second.join(' • ')}`].filter(Boolean).join('\n');
  }

  return displayReply(context, payload);
}

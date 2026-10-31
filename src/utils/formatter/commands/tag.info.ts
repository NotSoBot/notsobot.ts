import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserStore from '../../../stores/users';
import { getTranslator } from '../../i18n';

import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import {
  DisplayPayload,
  Paginator,
  createTagDirectoryUrl,
  createUserString,
  displayReply,
  fetchMemberOrUserById,
} from '../../../utils';


export const COMMAND_ID = 'tag.info';

// longer content gets uploaded as a file, so the tag info stays readable (and fits in a 2000 character text message)
const TAG_CONTENT_MAX_INLINE_LENGTH = 1000;

export interface CommandArgs {
  // page through long content instead of uploading it as a file
  nofile?: boolean,
  tag: RestResponsesRaw.Tag,
}

// relative only to keep the line short, discord shows the full date when hovering it
function formatTimestamp(value: string): string {
  return Markup.timestamp(Date.parse(value), MarkupTimestampStyles.RELATIVE);
}

// cut at the last line break in the second half of a page (the break itself is the page boundary), hard cut otherwise,
// nothing else is trimmed so the pages together are the exact content
function splitContent(content: string, size: number): Array<string> {
  const pages: Array<string> = [];
  while (size < content.length) {
    const newline = content.lastIndexOf('\n', size);
    if (size / 2 < newline) {
      pages.push(content.slice(0, newline));
      content = content.slice(newline + 1);
    } else {
      pages.push(content.slice(0, size));
      content = content.slice(size);
    }
  }
  pages.push(content);
  return pages;
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

  // the content's codeblocks, only more than one with -nofile
  let pages: Array<string> = [];

  // where the tag comes from goes in its own block between the tag info and the invoker line, so the content stays right under the title
  // plain text since embed footers (where embeds show it) don't render markdown, the title links to the directory page instead
  if (tag.reference_tag) {
    if (tag.reference_tag.is_on_directory) {
      payload.url = createTagDirectoryUrl(tag.reference_tag.id);
      payload.note = translate('tag_info.using_tag_from_the_tag_directory', {reference_tag: tag.reference_tag.name});
    } else {
      let message = translate('tag_info.alias_of_tag', {name: tag.reference_tag.name});

      const user = await UserStore.getOrFetch(context, tag.reference_tag.user.id);
      if (user && user.channelId === tag.reference_tag.server_id) {
        const owner = await fetchMemberOrUserById(context, tag.reference_tag.user.id);
        message = translate('tag_info.from_s_dms', {message: message, user: (owner) ? String(owner) : translate('tag.deleted_user')});
      }

      payload.note = message;
    }
  } else if (tag.is_on_directory) {
    payload.url = createTagDirectoryUrl(tag.id);
    payload.note = translate('tag_info.tag_from_the_tag_directory');
  } else if (TAG_CONTENT_MAX_INLINE_LENGTH < tag.content.length && !args.nofile) {
    const filename = tag.name.replace(/[^\w.+-]/g, '_').slice(0, 64);
    payload.files = [{filename: `${tag.id}.${filename}.txt`, value: tag.content}];
  } else {
    pages = splitContent(tag.content, TAG_CONTENT_MAX_INLINE_LENGTH);
  }

  // two small lines under the content instead of a labelled line for each, nsfw only shows when it is
  let details: string;
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

    details = `-# ${first.join(' • ')}\n-# ${second.join(' • ')}`;
  }

  if (pages.length <= 1) {
    payload.description = [(pages.length) ? Markup.codeblock(pages[0]) : null, details].filter(Boolean).join('\n');
    return displayReply(context, payload);
  }

  const paginator = new Paginator(context, {
    pageLimit: pages.length,
    onPage: (pageNumber) => {
      return {
        display: {
          ...payload,
          description: `${Markup.codeblock(pages[pageNumber - 1])}\n${details}`,
          footer: translate('common.page_of', {page: pageNumber, total: pages.length}),
        },
      };
    },
  });
  return await paginator.start();
}

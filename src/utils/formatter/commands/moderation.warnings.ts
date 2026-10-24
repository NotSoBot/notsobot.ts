import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildWarnings } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, MAX_GUILD_WARNING_USER_AMOUNT } from '../../../constants';
import { Translator, getTranslator } from '../../i18n';
import { DisplayPayload, Paginator, chunkArray, displayDetailsLine, displayReply, displayTimestamp, formatDuration, formatUserTag } from '../../../utils';

import { formatCounts } from './moderation.warn';


export const COMMAND_ID = 'moderation.warnings';

export const WARNINGS_PER_PAGE = 5;
// shown from the reason in the list, `warnings remove` shows all of it
export const REASON_PREVIEW_LENGTH = 200;

export interface CommandArgs {
  // only theirs, the server's newest otherwise
  user?: Structures.Member | Structures.User | null,
}

// "`id` • by @moderator • 2 days ago", plus "inactive" for ones from before the server's window
export function formatWarningDetails(
  translate: Translator['translate'],
  warning: RestResponsesRaw.GuildWarning,
  window: number,
): string {
  const created = Date.parse(warning.created);
  return displayDetailsLine([
    Markup.codestring(warning.id),
    translate('moderation_warnings.by', {user: `<@${warning.moderator_id}>`}),
    displayTimestamp(created),
    (created < Date.now() - window * 1000) && translate('moderation_warnings.inactive'),
  ], true);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  const user = args.user || null;

  // a member can't have more than a page of these, the whole server's list is only its newest ones
  const response = await fetchGuildWarnings(context, context.guildId!, {
    limit: MAX_GUILD_WARNING_USER_AMOUNT,
    userId: (user) ? user.id : undefined,
  });
  const { warnings, window } = response;

  const title = (user) ? translate('moderation_warnings.title_user', {user: formatUserTag(user)}) : translate('moderation_warnings.title');
  if (!warnings.length) {
    const text = (user) ? translate('moderation_warnings.none_user', {user: user.mention}) : translate('moderation_warnings.none');
    return displayReply(context, {description: text});
  }

  const pages = chunkArray<RestResponsesRaw.GuildWarning>(warnings, WARNINGS_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const description: Array<string> = [];
      for (let warning of pages[page - 1]) {
        const reason = (warning.reason) ? Markup.escape.all(warning.reason.slice(0, REASON_PREVIEW_LENGTH)) : `*${translate('moderation.unspecified_reason')}*`;
        description.push((user) ? reason : `<@${warning.user_id}> • ${reason}`);
        description.push(formatWarningDetails(translate, warning, window));
      }
      description.push('');
      description.push(displayDetailsLine([translate('moderation_warnings.window', {duration: formatDuration(window * 1000, language)})], true));

      const payload: DisplayPayload = {
        color: EmbedColors.DEFAULT,
        description: description.join('\n'),
        footer: `${formatCounts(translator, {active: response.active, total: response.count})} ${translate('common.page_of', {page, total: pageLimit})}`,
        title,
      };
      return {display: payload};
    },
  });
  return await paginator.start();
}

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildReports } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, ReportStatuses } from '../../../constants';
import { Translator, getTranslator } from '../../i18n';
import { DisplayPayload, Paginator, chunkArray, displayDetailsLine, displayReply, displayTimestamp } from '../../../utils';

import { getReportMessageUrl } from './guild.report';
import { formatReasonLine } from './moderation.warnings';


export const COMMAND_ID = 'moderation.reports';

export const REPORTS_PER_PAGE = 5;
// the newest ones, older ones are still on the reports loggers' messages
export const MAX_REPORTS = 100;

export interface CommandArgs {
  // who reported who stays between the moderators
  isEphemeral?: boolean,
  status?: ReportStatuses,
}

function getStatusText(translate: Translator['translate'], status: ReportStatuses): string {
  switch (status) {
    case ReportStatuses.OPEN: return translate('report_list.status_open');
    case ReportStatuses.RESOLVED: return translate('report_list.status_resolved');
    case ReportStatuses.DISMISSED: return translate('report_list.status_dismissed');
  }
  return String(status);
}

// "@member • `reason`", then "`id` • by @reporter • 2 days ago • Resolved • Message", the status left out when only one was asked for
function formatReport(translator: Translator, report: RestResponsesRaw.GuildReport, showStatus: boolean): Array<string> {
  const { translate } = translator;
  const url = getReportMessageUrl(report);
  return [
    `<@${report.target_id}> • ${formatReasonLine(report.reason)}`,
    displayDetailsLine([
      Markup.codestring(report.id),
      translate('moderation_warnings.by', {user: `<@${report.user_id}>`}),
      displayTimestamp(Date.parse(report.created)),
      showStatus && getStatusText(translate, report.status),
      (url) && Markup.url(translate('guild_report_log.message'), url),
    ], true),
  ];
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs = {},
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;

  const response = await fetchGuildReports(context, context.guildId!, {limit: MAX_REPORTS, status: args.status});
  const { reports } = response;
  if (!reports.length) {
    return displayReply(context, {description: translate('moderation_reports.none'), ephemeral: args.isEphemeral});
  }

  const title = (args.status === undefined)
    ? translate('moderation_reports.title')
    : translate('moderation_reports.title_status', {status: getStatusText(translate, args.status)});
  const pages = chunkArray<RestResponsesRaw.GuildReport>(reports, REPORTS_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    isEphemeral: args.isEphemeral,
    pageLimit,
    onPage: (page) => {
      const description: Array<string> = [];
      for (let report of pages[page - 1]) {
        description.push(...formatReport(translator, report, args.status === undefined));
      }
      const payload: DisplayPayload = {
        color: EmbedColors.DEFAULT,
        description: description.join('\n'),
        footer: `${translate('report_list.reports', {count: response.count.toLocaleString(language)})} ${translate('common.page_of', {page, total: pageLimit})}`,
        title,
      };
      return {display: payload};
    },
  });
  return await paginator.start();
}

import { Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import { fetchReports } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, ReportStatuses, ReportTypes } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray } from '../../../utils';


export const COMMAND_ID = 'report.list';

export const RESULTS_PER_PAGE = 5;
export const MAX_PREVIEW_LENGTH = 128;

export const ReportStatusEmojis: Record<ReportStatuses, string> = {
  [ReportStatuses.OPEN]: '🟡',
  [ReportStatuses.RESOLVED]: '🟢',
  [ReportStatuses.DISMISSED]: '⚪',
};

export interface CommandArgs {
  isEphemeral?: boolean,
  status?: ReportStatuses,
}

type Report = RestResponsesRaw.FetchReports['reports'][number];

export async function createMessage(
  context: Interaction.InteractionContext,
  args: CommandArgs = {},
) {
  const { language, translate } = await getTranslator(context);

  const result = await fetchReports(context, {status: args.status});

  const statusLabel = (status: ReportStatuses) => {
    switch (status) {
      case ReportStatuses.OPEN: return translate('report_list.status_open');
      case ReportStatuses.RESOLVED: return translate('report_list.status_resolved');
      case ReportStatuses.DISMISSED: return translate('report_list.status_dismissed');
    }
    return String(status);
  };

  const typeLabel = (report: Report) => {
    switch (report.type) {
      case ReportTypes.BUG: return translate('report_list.type_bug');
      case ReportTypes.USER: return translate('report_list.type_user', {target: `<@${report.target_id}>`});
      case ReportTypes.SERVER: return translate('report_list.type_server', {target: Markup.codestring(report.target_id || '')});
      case ReportTypes.MESSAGE: {
        // message reports store the reported message, not where the report was sent from
        const target = (report.channel_id && report.message_id)
          ? Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(report.guild_id, report.channel_id, report.message_id)
          : Markup.codestring(report.message_id || '');
        return translate('report_list.type_message', {target});
      };
      case ReportTypes.TAG: return translate('report_list.type_tag', {target: Markup.codestring(report.target_id || '')});
    }
    return String(report.type);
  };

  const pages = chunkArray<Report>(result.reports, RESULTS_PER_PAGE);
  const pageLimit = pages.length || 1;
  const paginator = new Paginator(context, {
    isEphemeral: args.isEphemeral,
    pageLimit,
    onPage: (pageNumber) => {
      const payload: DisplayPayload = {fields: []};
      payload.color = EmbedColors.DEFAULT;
      payload.title = (args.status === undefined)
        ? translate('report_list.your_reports')
        : translate('report_list.your_reports_with_status', {status: statusLabel(args.status)});

      let footer = translate('report_list.reports', {count: result.count.toLocaleString(language)});
      if (pageLimit !== 1) {
        footer = translate('report_list.page_of', {footer, pageLimit, pageNumber});
      }
      payload.footer = footer;

      const reports = pages[pageNumber - 1];
      if (reports && reports.length) {
        const description: Array<string> = [];
        for (let report of reports) {
          const created = Markup.timestamp(Date.parse(report.created), MarkupTimestampStyles.RELATIVE);
          description.push([
            `${ReportStatusEmojis[report.status] || ''} ${Markup.bold(statusLabel(report.status))}`,
            typeLabel(report),
            created,
            Markup.codestring(report.id),
          ].join(' · '));

          const content = (MAX_PREVIEW_LENGTH < report.content.length)
            ? `${report.content.slice(0, MAX_PREVIEW_LENGTH - 2)}...`
            : report.content;
          description.push(`-> ${Markup.codestring(content)}`);

          if (report.reviewed_at) {
            const reviewed = Markup.timestamp(Date.parse(report.reviewed_at), MarkupTimestampStyles.RELATIVE);
            description.push(`-> ${translate('report_list.reviewed', {timestamp: reviewed})}`);
          }
        }
        payload.description = description.join('\n');
      } else {
        payload.description = translate('report_list.no_reports_found');
      }

      return {display: payload};
    },
  });
  return await paginator.start();
}

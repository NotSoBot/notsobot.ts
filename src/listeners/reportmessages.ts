import { ClusterClient } from 'detritus-client';
import { MarkupTimestampStyles, MessageFlags } from 'detritus-client/lib/constants';
import { Components, Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { EventSubscription } from 'detritus-utils';

import { Listener } from './listener';

import { Domains } from '../api/endpoints';
import { ApiEventsSpewer } from '../apievents';
import { EmbedColors, RedisChannels, ReportStatuses, ReportTypes, UserSettingsResponseDisplayTypes } from '../constants';
import UserSettingsStore from '../stores/usersettings';
import { RedisPayloads } from '../types';
import { Languages, Translator, getTranslatorForLanguage, languageFromLocale } from '../utils/i18n';
import {
  ContainerSection,
  addContainerBody,
  addContainerFooter,
  createContainerTitle,
  sanitizeEmbed,
  truncate,
} from '../utils/formatter/loggers';


// fits in an embed field (1024) with room to spare, and well under the 2000 for text
const MAX_REPLY_LENGTH = 1000;
const MAX_REPORT_PREVIEW_LENGTH = 300;

// the side color is the report's status, same colors the loggers use
const ReportStatusColors: Record<ReportStatuses, number> = {
  [ReportStatuses.OPEN]: EmbedColors.LOG_UPDATE,
  [ReportStatuses.RESOLVED]: EmbedColors.LOG_CREATION,
  [ReportStatuses.DISMISSED]: EmbedColors.DEFAULT,
};


// DMs the reporter when staff reply to their report or change its status on the admin dashboard
// laid out like the guild loggers: the report's status and type as the header ("Closed User Report") with its info
// lines, the reply and the report as titled sections, then the event in the footer, with the status as the side color
class ReportMessagesListener extends Listener {
  // every cluster gets the event, only one should send the dm
  shouldHandle(cluster: ClusterClient): boolean {
    return cluster.clusterId === 0;
  }

  createMessage(
    translator: Translator,
    display: UserSettingsResponseDisplayTypes,
    payload: RedisPayloads.ReportMessageCreate,
  ): Record<string, any> {
    const { translate } = translator;
    const { message, report } = payload;
    const url = `${Domains.STABLE}/dashboard/reports/${report.id}`;
    const buttonLabel = translate('report_message_dm.view_report');
    const color = ReportStatusColors[report.status as ReportStatuses] ?? EmbedColors.DEFAULT;

    // like "Closed User Report", the side color is the status too
    const title = this.createTitle(translator, report.status, report.type);
    const information = this.createInformationLines(translator, report);
    // a status change has no content, the new status is in the title
    const reply = (message.content) ? Markup.codeblock(truncate(message.content, MAX_REPLY_LENGTH)) : null;
    const reportContent = Markup.codeblock(truncate(report.content, MAX_REPORT_PREVIEW_LENGTH));
    const footer = (message.content)
      ? translate('report_message_dm.footer_reply')
      : translate('report_message_dm.footer_status');
    const happened = Markup.timestamp(Date.parse(message.created), MarkupTimestampStyles.BOTH_SHORT);

    const allowedMentions = {parse: []};
    switch (display) {
      case UserSettingsResponseDisplayTypes.LEGACY: {
        const embed = new Embed();
        embed.setColor(color);
        embed.setTitle(title);
        embed.setDescription(information.join('\n'));
        if (reply) {
          embed.addField(translate('report_message_dm.reply'), reply);
        }
        embed.addField(translate('report_message_dm.your_report'), reportContent);
        embed.setFooter(footer);
        embed.setTimestamp(message.created);

        const components = new Components();
        components.addButton({label: buttonLabel, url});
        return {allowedMentions, components, embed: sanitizeEmbed(embed)};
      };
      case UserSettingsResponseDisplayTypes.NO_EMBED: {
        // no side color in text, the title has the status
        const lines = [`**${title}**`, ...information];
        if (reply) {
          lines.push(`**${translate('report_message_dm.reply')}**`, reply);
        }
        lines.push(`**${translate('report_message_dm.your_report')}**`, reportContent, `-# ${footer} • ${happened}`);

        const components = new Components();
        components.addButton({label: buttonLabel, url});
        return {allowedMentions, components, content: lines.join('\n')};
      };
    }

    const components = new Components();
    const container = components.createContainer();
    container.setAccentColor(color);
    // the logger header, with the button where their avatar thumbnail would be
    const header = container.createSection();
    header.addTextDisplay({content: [createContainerTitle(title), ...information].join('\n')});
    header.setAccessoryButton({label: buttonLabel, url});
    container.addSeparator();
    const sections: Array<ContainerSection> = [];
    if (reply) {
      sections.push({title: translate('report_message_dm.reply'), lines: [reply]});
    }
    sections.push({title: translate('report_message_dm.your_report'), lines: [reportContent]});
    addContainerBody(container, sections);
    addContainerFooter(container, `${footer} • ${happened}`);
    return {allowedMentions, components, flags: MessageFlags.IS_COMPONENTS_V2};
  }

  createInformationLines(translator: Translator, report: RedisPayloads.ReportMessageCreate['report']): Array<string> {
    const { translate } = translator;
    const lines = [
      `**${translate('report_message_dm.report_id')}**: ${Markup.codestring(report.id)}`,
    ];

    let target: null | string = null;
    switch (report.type) {
      case ReportTypes.USER: target = `<@${report.target_id}>`; break;
      case ReportTypes.SERVER:
      case ReportTypes.TAG: target = Markup.codestring(report.target_id || ''); break;
      case ReportTypes.MESSAGE: {
        // message reports store the reported message, not where the report was sent from
        if (report.channel_id && report.message_id) {
          target = Markup.url(report.message_id, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(report.guild_id, report.channel_id, report.message_id));
        } else if (report.message_id) {
          target = Markup.codestring(report.message_id);
        }
      }; break;
    }
    if (target) {
      lines.push(`**${translate('report_message_dm.reported')}**: ${target}`);
    }

    lines.push(`**${translate('common.created')}**: ${Markup.timestamp(Date.parse(report.created), MarkupTimestampStyles.RELATIVE)}`);
    return lines;
  }

  createTitle(translator: Translator, status: ReportStatuses, type: ReportTypes): string {
    const { translate } = translator;
    let typeText: string;
    switch (type) {
      case ReportTypes.BUG: typeText = translate('report_message_dm.type_bug'); break;
      case ReportTypes.MESSAGE: typeText = translate('report_message_dm.type_message'); break;
      case ReportTypes.SERVER: typeText = translate('report_message_dm.type_server'); break;
      case ReportTypes.TAG: typeText = translate('report_message_dm.type_tag'); break;
      case ReportTypes.USER: typeText = translate('report_message_dm.type_user'); break;
      default: typeText = translate('report_message_dm.type_report');
    }
    switch (status) {
      case ReportStatuses.OPEN: return translate('report_message_dm.title_open', {type: typeText});
      case ReportStatuses.RESOLVED: return translate('report_message_dm.title_resolved', {type: typeText});
      case ReportStatuses.DISMISSED: return translate('report_message_dm.title_dismissed', {type: typeText});
    }
    return typeText;
  }

  async sendMessage(cluster: ClusterClient, payload: RedisPayloads.ReportMessageCreate): Promise<void> {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    // no command to take these from, so it's the reporter's own settings or the defaults
    const settings = await UserSettingsStore.getOrFetch({client: shard}, payload.user_id);
    const display = (settings && typeof(settings.response_display) === 'number')
      ? settings.response_display as UserSettingsResponseDisplayTypes
      : UserSettingsResponseDisplayTypes.DEFAULT;
    const translator = getTranslatorForLanguage(languageFromLocale(settings && settings.locale) || Languages.ENGLISH);

    const message = this.createMessage(translator, display, payload);

    let channelId = payload.channel_id;
    if (!channelId) {
      const channel = await shard.rest.createDm({recipientId: payload.user_id});
      channelId = channel.id;
    }
    await shard.rest.createMessage(channelId, message);
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    if (!this.shouldHandle(cluster)) {
      return [];
    }

    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = apiEvents.subscribe(RedisChannels.REPORT_MESSAGE_CREATE, (payload: RedisPayloads.ReportMessageCreate) => {
        // closed dms (or a deleted account) are expected, the reply is still on their dashboard
        this.sendMessage(cluster, payload).catch((error) => {
          console.error(`Failed to DM report message ${payload.message.id} to ${payload.user_id}`, error);
        });
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new ReportMessagesListener();

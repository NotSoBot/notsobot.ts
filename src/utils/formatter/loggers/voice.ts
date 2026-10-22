import { ShardClient, Structures } from 'detritus-client';
import { AuditLogChangeKeys } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed, createUserString } from '../../../utils';

import type { Translator } from '../../i18n';
import { ContainerSection, addContainerFooter, addContainerHeader, createFooterTimestamp, createUserHeaderLines } from './tools';
import { LogPayloadFiles, GuildLoggingEventVoiceStateUpdate } from './types';


export function getVoiceChannelText(shard: ShardClient, channelId: string): string {
  if (shard.channels.has(channelId)) {
    const channel = shard.channels.get(channelId) as Structures.Channel;
    return `**${Markup.codestring(channel.toString())}**`;
  }
  return `<#${channelId}>`;
}


export function getVoiceStateUpdateSections(event: GuildLoggingEventVoiceStateUpdate, translator: Translator): {
  // lines under the user's mention (joins, leaves)
  actions: Array<string>,
  audit: ContainerSection | null,
  changes: Array<string>,
  color: number,
  footer: string,
} {
  const { language, translate, translateMaybe } = translator;
  const { audits } = event;

  const { voiceState } = event.cached;
  const { differences, leftChannel, shard } = event.payload;

  let color: number;
  let footer: string;
  {
    if (leftChannel) {
      color = EmbedColors.LOG_DELETION;
      footer = translate('logger.voice.footer.left');
    } else if (differences) {
      color = EmbedColors.LOG_UPDATE;
      if (differences.channelId && differences.sessionId) {
        footer = translate('logger.voice.footer.changed_channels_device');
      } else if (differences.channelId) {
        footer = translate('logger.voice.footer.changed_channels');
      } else if (differences.sessionId) {
        footer = translate('logger.voice.footer.rejoined_device');
      } else {
        footer = translate('logger.voice.footer.updated');
      }
    } else {
      color = EmbedColors.LOG_CREATION;
      footer = translate('logger.voice.footer.joined');
    }
  }

  let shouldLogMuteDeaf: boolean = true;
  let audit: ContainerSection | null = null;
  if (audits) {
    // mute/deafen
    const [ firstAudit ] = audits;
    const isSelf = voiceState.userId === firstAudit.userId;

    const description: Array<string> = [];
    if (!isSelf) {
      description.push(translate('logger.by', {user: createUserString(firstAudit.userId, firstAudit.user as Structures.User)}));
    }
    for (let [x, change] of firstAudit.changes) {
      switch (change.key) {
        case AuditLogChangeKeys.DEAF: {
          shouldLogMuteDeaf = false;
          description.push(`- ${(change.newValue) ? translate('logger.voice.deafened') : translate('logger.voice.undeafened')}`);
        }; break;
        case AuditLogChangeKeys.MUTE: {
          shouldLogMuteDeaf = false;
          description.push(`- ${(change.newValue) ? translate('logger.voice.muted') : translate('logger.voice.unmuted')}`);
        }; break;
      }
    }

    if (firstAudit.reason) {
      description.push(`**${translate('logger.reason')}**: ${Markup.codeblock(firstAudit.reason)}`);
    }
    audit = {title: (isSelf) ? translate('logger.self_action') : translate('logger.moderation_action'), lines: description};
  }

  const actions: Array<string> = [];
  const changes: Array<string> = [];
  if (differences) {
    if (leftChannel && differences.channelId) {
      actions.push(`- ${translate('logger.voice.disconnected_from', {channel: getVoiceChannelText(shard, differences.channelId)})}`);
    } else {
      if (differences.channelId) {
        const oldChannelName = getVoiceChannelText(shard, differences.channelId);
        if (voiceState.channelId) {
          const channelName = getVoiceChannelText(shard, voiceState.channelId);
          if (differences.sessionId) {
            changes.push(`- ${translate('logger.voice.moved_device', {old: oldChannelName, new: channelName})}`);
          } else {
            changes.push(`- ${translate('logger.voice.moved', {old: oldChannelName, new: channelName})}`);
          }
        } else {
          // disconnected
        }
      } else if (differences.sessionId) {
        if (voiceState.channelId) {
          changes.push(`- ${translate('logger.voice.rejoined_channel_device', {channel: getVoiceChannelText(shard, voiceState.channelId)})}`);
        } else {
          changes.push(`- ${translate('logger.voice.rejoined_device')}`);
        }
      }

      if (shouldLogMuteDeaf) {
        const text: Array<string> = [];
        if (differences.deaf !== undefined) {
          text.push((voiceState.deaf) ? translate('logger.voice.deafened') : translate('logger.voice.undeafened'));
        }
        if (differences.mute !== undefined) {
          text.push((voiceState.mute) ? translate('logger.voice.muted') : translate('logger.voice.unmuted'));
        }
        if (text.length) {
          changes.push(`- ${translate('logger.voice.server_themselves', {actions: text.join(translate('logger.and'))})}`);
          if (audits && audits[0].reason) {
            changes.push(`-> ${translate('logger.reason')}: ${Markup.codestring(audits[0].reason || '')}`);
          }
        }
      }

      {
        const text: Array<string> = [];
        if (differences.selfDeaf !== undefined) {
          text.push((voiceState.selfDeaf) ? translate('logger.voice.deafened') : translate('logger.voice.undeafened'));
        }
        if (differences.selfMute !== undefined) {
          text.push((voiceState.selfMute) ? translate('logger.voice.muted') : translate('logger.voice.unmuted'));
        }
        if (text.length) {
          changes.push(`- ${translate('logger.voice.themselves', {actions: text.join(translate('logger.and'))})}`);
        }
      }

      {
        const text: Array<string> = [];
        if (differences.selfStream !== undefined) {
          text.push(translate((voiceState.selfStream) ? 'logger.voice.go_live_started' : 'logger.voice.go_live_stopped'));
        }
        if (differences.selfVideo !== undefined) {
          text.push(translate((voiceState.selfVideo) ? 'logger.voice.video_started' : 'logger.voice.video_stopped'));
        }
        if (text.length) {
          changes.push(`- ${text.join(translate('logger.and'))}`);
        }
      }

      if (differences.suppress !== undefined) {
        if (voiceState.suppress) {
          changes.push(`- ${translate('logger.voice.suppressed')}`);
        } else {
          changes.push(`- ${translate('logger.voice.unsuppressed')}`);
        }
      }
    }
  } else if (voiceState.channelId) {
    actions.push(`- ${translate('logger.voice.joined', {channel: getVoiceChannelText(shard, voiceState.channelId)})}`);
    {
      const text: Array<string> = [];
      if (voiceState.selfDeaf) {
        text.push(translate('logger.voice.self_deafened'));
      }
      if (voiceState.selfMute) {
        text.push(translate('logger.voice.self_muted'));
      }
      if (voiceState.selfVideo) {
        text.push(translate('logger.voice.streaming_video'));
      }
      if (text.length) {
        actions.push(`- ${text.join(', ')}`);
      }
    }
  }

  return {actions, audit, changes, color, footer};
}


export function formatVoiceStateUpdate(
  event: GuildLoggingEventVoiceStateUpdate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;
  const { voiceState } = event.cached;

  if (voiceState.member) {
    createUserEmbed(voiceState.member, embed);
    embed.setDescription(voiceState.member.mention);
  }

  const { actions, audit, changes, color, footer } = getVoiceStateUpdateSections(event, translator);
  embed.setColor(color);
  embed.setFooter(`${footer} • ${createTimestampStringFromGuild(happened, guildId)}`);

  if (audit) {
    embed.addField(audit.title!, audit.lines.join('\n'));
  }
  if (actions.length) {
    embed.setDescription([
      ((voiceState.member) ? voiceState.member.mention : voiceState.userId) + '\n',
      ...actions,
    ].join('\n'));
  }
  if (changes.length) {
    embed.addField(translate('logger.changes'), changes.join('\n'));
  }
}


export function formatVoiceStateUpdateComponents(
  event: GuildLoggingEventVoiceStateUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { happened } = event;
  const { voiceState } = event.cached;
  const { member } = voiceState;

  const { actions, audit, changes, color, footer } = getVoiceStateUpdateSections(event, translator);

  const sections: Array<ContainerSection> = [];
  if (audit) {
    sections.push(audit);
  }
  sections.push({title: translate('logger.changes'), lines: changes});

  container.setAccentColor(color);
  // the changes go next to the avatar thumbnail, the footer adds the divider so there's no body
  addContainerHeader(
    container,
    [...createUserHeaderLines(voiceState.userId, member, translator), ...actions],
    (member) ? member.avatarUrlFormat(null, {size: 1024}) : null,
    false,
    sections,
  );
  addContainerFooter(container, `${footer} • ${createFooterTimestamp(happened)}`);
}

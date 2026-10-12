import { ShardClient, Structures } from 'detritus-client';
import { AuditLogChangeKeys } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed, createUserString } from '../../../utils';

import { ContainerSection, addContainerBody, addContainerFooter, addContainerHeader, createUserHeaderLines } from './tools';
import { LogPayloadFiles, GuildLoggingEventVoiceStateUpdate } from './types';


export function getVoiceChannelText(shard: ShardClient, channelId: string): string {
  if (shard.channels.has(channelId)) {
    const channel = shard.channels.get(channelId) as Structures.Channel;
    return `**${Markup.codestring(channel.toString())}**`;
  }
  return `<#${channelId}>`;
}


export function getVoiceStateUpdateSections(event: GuildLoggingEventVoiceStateUpdate): {
  // lines under the user's mention (joins, leaves)
  actions: Array<string>,
  audit: ContainerSection | null,
  changes: Array<string>,
  color: number,
  footer: string,
} {
  const { audits, guildId, happened } = event;

  const { voiceState } = event.cached;
  const { differences, leftChannel, shard } = event.payload;

  let color: number;
  let footer: string;
  {
    let text: string;
    if (leftChannel) {
      color = EmbedColors.LOG_DELETION;
      text = 'Left Voice';
    } else if (differences) {
      color = EmbedColors.LOG_UPDATE;
      if (differences.channelId && differences.sessionId) {
        text = 'Changed Channels from a different device';
      } else if (differences.channelId) {
        text = 'Changed Channels';
      } else if (differences.sessionId) {
        text = 'Rejoined Voice from a different device';
      } else {
        text = 'Voice State Updated';
      }
    } else {
      color = EmbedColors.LOG_CREATION;
      text = 'Joined Voice';
    }
    footer = `${text} • ${createTimestampStringFromGuild(happened, guildId)}`;
  }

  let shouldLogMuteDeaf: boolean = true;
  let audit: ContainerSection | null = null;
  if (audits) {
    // mute/deafen
    const [ firstAudit ] = audits;
    const isSelf = voiceState.userId === firstAudit.userId;

    const description: Array<string> = [];
    if (!isSelf) {
      description.push(`By ${createUserString(firstAudit.userId, firstAudit.user as Structures.User)}`);
    }
    for (let [x, change] of firstAudit.changes) {
      switch (change.key) {
        case AuditLogChangeKeys.DEAF: {
          shouldLogMuteDeaf = false;
          description.push(`- ${(change.newValue) ? 'Deafened' : 'Undeafened'}`);
        }; break;
        case AuditLogChangeKeys.MUTE: {
          shouldLogMuteDeaf = false;
          description.push(`- ${(change.newValue) ? 'Muted' : 'Unmuted'}`);
        }; break;
      }
    }

    if (firstAudit.reason) {
      description.push(`**Reason**: ${Markup.codeblock(firstAudit.reason)}`);
    }
    audit = {title: (isSelf) ? 'Self-Action' : 'Moderation Action', lines: description};
  }

  const actions: Array<string> = [];
  const changes: Array<string> = [];
  if (differences) {
    if (leftChannel && differences.channelId) {
      actions.push(`- Disconnected from ${getVoiceChannelText(shard, differences.channelId)}`);
    } else {
      if (differences.channelId) {
        const oldChannelName = getVoiceChannelText(shard, differences.channelId);
        if (voiceState.channelId) {
          const channelName = getVoiceChannelText(shard, voiceState.channelId);
          if (differences.sessionId) {
            changes.push(`- Moved from ${oldChannelName} to ${channelName} from a different device`);
          } else {
            changes.push(`- Moved from ${oldChannelName} to ${channelName}`);
          }
        } else {
          // disconnected
        }
      } else if (differences.sessionId) {
        if (voiceState.channelId) {
          changes.push(`- Rejoined ${getVoiceChannelText(shard, voiceState.channelId)} on a different device`);
        } else {
          changes.push('- Rejoined on a different device');
        }
      }

      if (shouldLogMuteDeaf) {
        const text: Array<string> = [];
        if (differences.deaf !== undefined) {
          text.push((voiceState.deaf) ? 'Deafened' : 'Undeafened');
        }
        if (differences.mute !== undefined) {
          text.push((voiceState.mute) ? 'Muted' : 'Unmuted');
        }
        if (text.length) {
          changes.push(`- Server ${text.join(' and ')} Themselves`);
          if (audits && audits[0].reason) {
            changes.push(`-> Reason: ${Markup.codestring(audits[0].reason || '')}`);
          }
        }
      }

      {
        const text: Array<string> = [];
        if (differences.selfDeaf !== undefined) {
          text.push((voiceState.selfDeaf) ? 'Deafened' : 'Undeafened');
        }
        if (differences.selfMute !== undefined) {
          text.push((voiceState.selfMute) ? 'Muted' : 'Unmuted');
        }
        if (text.length) {
          changes.push(`- ${text.join(' and ')} Themselves`);
        }
      }

      {
        const text: Array<string> = [];
        if (differences.selfStream !== undefined) {
          text.push(`${(voiceState.selfStream) ? 'Started' : 'Stopped'} using Go Live`);
        }
        if (differences.selfVideo !== undefined) {
          text.push(`${(voiceState.selfVideo) ? 'Started' : 'Stopped'} Streaming Video`);
        }
        if (text.length) {
          changes.push(`- ${text.join(' and ')}`);
        }
      }

      if (differences.suppress !== undefined) {
        if (differences.suppress) {
          changes.push('- Suppressed');
        } else {
          changes.push('- Unsuppressed');
        }
      }
    }
  } else if (voiceState.channelId) {
    actions.push(`- Joined ${getVoiceChannelText(shard, voiceState.channelId)}`);
    {
      const text: Array<string> = [];
      if (voiceState.selfDeaf) {
        text.push('Self Deafened');
      }
      if (voiceState.selfMute) {
        text.push('Self Muted');
      }
      if (voiceState.selfVideo) {
        text.push('Streaming Video');
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
): void {
  const { voiceState } = event.cached;

  if (voiceState.member) {
    createUserEmbed(voiceState.member, embed);
    embed.setDescription(voiceState.member.mention);
  }

  const { actions, audit, changes, color, footer } = getVoiceStateUpdateSections(event);
  embed.setColor(color);
  embed.setFooter(footer);

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
    embed.addField('Changes', changes.join('\n'));
  }
}


export function formatVoiceStateUpdateComponents(
  event: GuildLoggingEventVoiceStateUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { voiceState } = event.cached;
  const { member } = voiceState;

  const { actions, audit, changes, color, footer } = getVoiceStateUpdateSections(event);

  container.setAccentColor(color);
  addContainerHeader(
    container,
    [...createUserHeaderLines(voiceState.userId, member), ...actions],
    (member) ? member.avatarUrlFormat(null, {size: 1024}) : null,
  );

  const sections: Array<ContainerSection> = [];
  if (audit) {
    sections.push(audit);
  }
  sections.push({title: 'Changes', lines: changes});
  addContainerBody(container, sections);
  addContainerFooter(container, footer);
}

import { Structures } from 'detritus-client';
import { AuditLogActions, AuditLogChangeKeys, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed, createUserString, formatDuration } from '../../../utils';

import type { Translator } from '../../i18n';
import {
  ContainerSection,
  addContainerBody,
  addContainerFooter,
  addContainerGallery,
  addContainerHeader,
  addImageFiles,
  createFooterTimestamp,
  createRelativeTimestamp,
  createUserHeaderLines,
} from './tools';
import { LogPayloadFiles, GuildLoggingEventGuildMemberAdd, GuildLoggingEventGuildMemberRemove, GuildLoggingEventGuildMemberUpdate } from './types';


export interface JoinedTimestamp {
  title: string,
  unix: number,
}

export function createJoinedLines(joined: Array<JoinedTimestamp>): Array<string> {
  return joined.map(({ title, unix }) => `**${title}**: ${createRelativeTimestamp(unix)}`);
}


export function getGuildMemberAddSections(event: GuildLoggingEventGuildMemberAdd, translator: Translator): {
  footer: string,
  footerUnix: number,
  information: Array<string>,
  joined: Array<JoinedTimestamp>,
  moderation: Array<string>,
} {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { memberCount } = event.cached;
  const { member } = event.payload;

  let footer: string;
  if (audits) {
    footer = translate('logger.footer.member_added');
  } else {
    // rename this to something else so you can search for the messages
    footer = translate('logger.footer.member_joined');
  }
  const footerUnix = member.joinedAtUnix || happened;

  const moderation: Array<string> = [];
  if (audits) {
    const [ audit ] = audits;
    moderation.push(`**${translate('logger.added_by')}**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
  }

  const information: Array<string> = [];
  information.push(`**${translate('common.id')}**: ${Markup.codestring(member.id)}`);
  information.push(`**${translate('user.bot')}**: ${(member.bot) ? translate('common.yes') : translate('common.no')}`);
  if (memberCount) {
    information.push(`**${translate('info.guild.members')}**: ${(memberCount - 1).toLocaleString(language)} -> ${memberCount.toLocaleString(language)}`);
  }

  const joined: Array<JoinedTimestamp> = [
    {title: translate('user.joined_discord'), unix: member.createdAtUnix},
  ];

  return {footer, footerUnix, information, joined, moderation};
}


export function formatGuildMemberAdd(
  event: GuildLoggingEventGuildMemberAdd,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId } = event;
  const { member } = event.payload;

  createUserEmbed(member, embed);
  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
  embed.setDescription(member.mention);

  const { footer, footerUnix, information, joined, moderation } = getGuildMemberAddSections(event, translator);
  embed.setFooter(`${footer} • ${createTimestampStringFromGuild(footerUnix, guildId)}`);
  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }
  embed.addField(translate('common.information'), information.join('\n'), true);
  embed.addField(translate('user.joined'), createJoinedLines(joined).join('\n'), true);
}


export function formatGuildMemberAddComponents(
  event: GuildLoggingEventGuildMemberAdd,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId } = event;
  const { member } = event.payload;

  const { footer, footerUnix, information, joined, moderation } = getGuildMemberAddSections(event, translator);

  container.setAccentColor(EmbedColors.LOG_CREATION);
  // the information goes next to the avatar thumbnail, otherwise the thumbnail leaves a big gap under the two name lines
  addContainerHeader(container, [...createUserHeaderLines(member.id, member, translator), ...information], member.avatarUrlFormat(null, {size: 1024}));
  addContainerBody(container, [
    {title: translate('logger.moderation_action'), lines: moderation},
    {title: translate('user.joined'), lines: createJoinedLines(joined)},
  ]);
  addContainerFooter(container, `${footer} • ${createFooterTimestamp(footerUnix)}`);
}


export function getGuildMemberRemoveSections(event: GuildLoggingEventGuildMemberRemove, translator: Translator): {
  footer: string,
  footerUnix: number,
  information: Array<string>,
  joined: Array<string>,
  moderation: Array<string>,
  user: Structures.User | null,
} {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { memberCount } = event.cached;
  const { member, userId } = event.payload;

  let user: Structures.User | null = event.payload.user || null;
  if (!user && audits) {
    // try to get the user object from the audit log
    const [ audit ] = audits;
    if (audit.user) {
      user = audit.user;
    }
  }

  let footer = translate('logger.footer.member_left');
  const moderation: Array<string> = [];
  if (audits) {
    const [ audit ] = audits;

    let userText = createUserString(audit.userId, audit.user as Structures.User);
    switch (audit.actionType) {
      case AuditLogActions.MEMBER_BAN_ADD: {
        moderation.push(`**${translate('logger.banned_by')}**: ${userText}`);
        footer = translate('logger.footer.member_banned');
      }; break;
      case AuditLogActions.MEMBER_KICK: {
        moderation.push(`**${translate('logger.kicked_by')}**: ${userText}`);
        footer = translate('logger.footer.member_kicked');
      }; break;
      default: {
        moderation.push(`**${translate('logger.unknown_reason')}**: ${userText}`);
        footer = translate('logger.footer.member_left_unknown', {action: audit.actionType});
      };
    }
    if (audit.reason) {
      moderation.push(`**${translate('logger.reason')}**: ${Markup.codeblock(audit.reason)}`);
    }
  }
  const information: Array<string> = [];
  information.push(`**${translate('common.id')}**: ${Markup.codestring(userId)}`);
  if (user) {
    information.push(`**${translate('user.bot')}**: ${(user.bot) ? translate('common.yes') : translate('common.no')}`);
  }
  if (memberCount) {
    information.push(`**${translate('info.guild.members')}**: ${(memberCount + 1).toLocaleString(language)} -> ${memberCount.toLocaleString(language)}`);
  }

  const timestamps: Array<JoinedTimestamp> = [];
  if (user) {
    timestamps.push({title: translate('user.joined_discord'), unix: user.createdAtUnix});
    if (member && member.joinedAtUnix) {
      timestamps.push({title: translate('user.joined_guild'), unix: member.joinedAtUnix});
    }
  }
  const joined = createJoinedLines(timestamps);
  if (user && member && member.joinedAtUnix) {
    // measured to when they left, the relative timestamp above keeps counting from whenever the log is viewed
    joined.push(`**${translate('logger.member.time_in_guild')}**: ${formatDuration(happened - member.joinedAtUnix, language, 2)}`);
  }

  return {footer, footerUnix: happened, information, joined, moderation, user};
}


export function formatGuildMemberRemove(
  event: GuildLoggingEventGuildMemberRemove,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId } = event;
  const { userId } = event.payload;

  const { footer, footerUnix, information, joined, moderation, user } = getGuildMemberRemoveSections(event, translator);
  if (user) {
    createUserEmbed(user, embed);
    embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
  } else {
    embed.setAuthor(translate('logger.unknown_user'));
  }
  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setDescription(`<@!${userId}>`);
  embed.setFooter(`${footer} • ${createTimestampStringFromGuild(footerUnix, guildId)}`);

  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }
  embed.addField(translate('common.information'), information.join('\n'), true);
  if (joined.length) {
    embed.addField(translate('user.joined'), joined.join('\n'), true);
  }
}


export function formatGuildMemberRemoveComponents(
  event: GuildLoggingEventGuildMemberRemove,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId } = event;
  const { userId } = event.payload;

  const { footer, footerUnix, information, joined, moderation, user } = getGuildMemberRemoveSections(event, translator);

  container.setAccentColor(EmbedColors.LOG_DELETION);
  // the information goes next to the avatar thumbnail, otherwise the thumbnail leaves a big gap under the two name lines
  addContainerHeader(container, [...createUserHeaderLines(userId, user, translator), ...information], (user) ? user.avatarUrlFormat(null, {size: 1024}) : null);
  addContainerBody(container, [
    {title: translate('logger.moderation_action'), lines: moderation},
    {title: translate('user.joined'), lines: joined},
  ]);
  addContainerFooter(container, `${footer} • ${createFooterTimestamp(footerUnix)}`);
}


// audit changes give an iso string, cached members give unix ms
export function createTimeoutUntilString(value: number | string): string {
  const unix = (typeof(value) === 'number') ? value : Date.parse(value);
  if (isNaN(unix)) {
    return Markup.codestring(String(value));
  }
  return createRelativeTimestamp(unix);
}


export function getGuildMemberUpdateAuditSection(event: GuildLoggingEventGuildMemberUpdate, translator: Translator): ContainerSection | null {
  const { language, translate, translateMaybe } = translator;
  const { audits } = event;
  const { member } = event.cached;
  if (!audits) {
    return null;
  }

  const [ firstAudit ] = audits;
  const isSelf = member.id === firstAudit.userId;

  const description: Array<string> = [];
  if (!isSelf) {
    description.push(translate('logger.by', {user: createUserString(firstAudit.userId, firstAudit.user)}));
  }

  let reason: string | undefined;
  for (let audit of audits) {
    for (let [x, change] of audit.changes) {
      switch (change.key) {
        case AuditLogChangeKeys.COMMUNICATION_DISABLED_UNTIL: {
          description.push(`- ${translate('logger.member.timeout_change')}`);
          if (change.newValue) {
            // must check if oldValue is newer than now to consider it a change
            if (change.oldValue && Date.now() < Date.parse(change.oldValue)) {
              description.push(`-> ${translate('logger.member.timeout_changed', {old: createTimeoutUntilString(change.oldValue), new: createTimeoutUntilString(change.newValue)})}`);
            } else {
              description.push(`-> ${translate('logger.member.timed_out_until', {until: createTimeoutUntilString(change.newValue)})}`);
            }
          } else {
            description.push(`-> ${translate('logger.member.timeout_cleared')}`);
          }
        }; break;
        case AuditLogChangeKeys.DEAF: {
          if (change.newValue) {
            description.push(`- ${translate('logger.voice.deafened')}`);
          } else {
            description.push(`- ${translate('logger.voice.undeafened')}`);
          }
        }; break;
        case AuditLogChangeKeys.MUTE: {
          if (change.newValue) {
            description.push(`- ${translate('logger.member.mic_muted')}`);
          } else {
            description.push(`- ${translate('logger.member.mic_unmuted')}`);
          }
        }; break;
        case AuditLogChangeKeys.NICK: {
          description.push(`- ${translate('logger.member.nickname_change')}`);
          if (change.oldValue) {
            if (change.newValue) {
              description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(change.oldValue)}**`, new: `**${Markup.codestring(change.newValue)}**`})}`);
            } else {
              description.push(`-> ${translate('logger.cleared', {value: `**${Markup.codestring(change.oldValue)}**`})}`);
            }
          } else {
            description.push(`-> ${translate('logger.set_to', {value: `**${Markup.codestring(change.newValue)}**`})}`);
          }
        }; break;
        case AuditLogChangeKeys.ROLES_ADD: {
          description.push(`- ${translate('logger.member.roles_added')}`);
          const roles = change.newValue.map((raw: {name: string, id: string}) => {
            return `<@&${raw.id}> (${Markup.escape.all(raw.name)})`;
          });
          description.push(`-> ${roles.join(', ')}`);
        }; break;
        case AuditLogChangeKeys.ROLES_REMOVE: {
          description.push(`- ${translate('logger.member.roles_removed')}`);
          const roles = change.newValue.map((raw: {name: string, id: string}) => {
            return `<@&${raw.id}> (${Markup.escape.all(raw.name)})`;
          });
          description.push(`-> ${roles.join(', ')}`);
        }; break;
        default: {
          description.push(`- ${translate('logger.member.key_changed', {key: change.key})}`);
          description.push(`-> ${Markup.escape.all(JSON.stringify(change.newValue))}`);
        };
      }
    }
    reason = audit.reason;
  }
  if (reason) {
    description.push(`**${translate('logger.reason')}**: ${Markup.codeblock(reason)}`);
  }

  return {title: (isSelf) ? translate('logger.self_action') : translate('logger.moderation_action'), lines: description};
}


export function getGuildMemberUpdateChanges(event: GuildLoggingEventGuildMemberUpdate, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const { audits } = event;
  const { member, old } = event.cached;

  const description: Array<string> = [];

  // for non-premium guilds and when someone unboosts/boosts
  if (!audits) {
    if (member.communicationDisabledUntilUnix !== old.communicationDisabledUntilUnix) {
      description.push(`- ${translate('logger.member.timeout_change')}`);
      if (member.communicationDisabledUntilUnix) {
        if (old.communicationDisabledUntilUnix && Date.now() < old.communicationDisabledUntilUnix) {
          description.push(`-> ${translate('logger.member.timeout_changed', {old: createTimeoutUntilString(old.communicationDisabledUntilUnix), new: createTimeoutUntilString(member.communicationDisabledUntilUnix)})}`);
        } else {
          description.push(`-> ${translate('logger.member.timed_out_until', {until: createTimeoutUntilString(member.communicationDisabledUntilUnix)})}`);
        }
      } else {
        description.push(`-> ${translate('logger.member.timeout_cleared')}`);
      }
    }

    if (member.deaf !== old.deaf || member.mute !== old.mute) {
      const text: Array<string> = [];
      if (member.deaf !== old.deaf) {
        text.push((member.deaf) ? translate('logger.voice.deafened') : translate('logger.voice.undeafened'));
      }
      if (member.mute !== old.mute) {
        text.push((member.mute) ? translate('logger.voice.muted') : translate('logger.voice.unmuted'));
      }
      if (text.length) {
        description.push(`- ${translate('logger.member.server_action', {actions: text.join(translate('logger.and'))})}`);
      }
    }

    if (member.nick !== old.nick) {
      description.push(`- ${translate('logger.member.nickname_change')}`);
      if (member.nick) {
        if (old.nick) {
          description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(old.nick)}**`, new: `**${Markup.codestring(member.nick)}**`})}`);
        } else {
          description.push(`-> ${translate('logger.set_to', {value: `**${Markup.codestring(member.nick || '')}**`})}`);
        }
      } else {
        description.push(`-> ${translate('logger.cleared', {value: `**${Markup.codestring(old.nick || '')}**`})}`);
      }
    }

    if (member.hasDifference('roles', old._roles || [])) {
      const additions: Array<string> = [];
      const removals: Array<string> = [];
      for (let [roleId, role] of member.roles) {
        if (!old.roles.has(roleId)) {
          if (role) {
            additions.push(`<@&${roleId}> (${Markup.escape.all(role.name)})`);
          } else {
            additions.push(`<@&${roleId}>`);
          }
        }
      }
      for (let [roleId, role] of old.roles) {
        if (!member.roles.has(roleId)) {
          if (role) {
            removals.push(`<@&${roleId}> (${Markup.escape.all(role.name)})`);
          } else {
            removals.push(`<@&${roleId}>`);
          }
        }
      }
      if (removals.length) {
        description.push(`- ${translate('logger.member.roles_removed')}`);
        description.push(`-> ${removals.join(', ')}`);
      }
      if (additions.length) {
        description.push(`- ${translate('logger.member.roles_added')}`);
        description.push(`-> ${additions.join(', ')}`);
      }
    }
  }

  if (member.hoistedRoleId !== old.hoistedRoleId) {
    description.push(`- ${translate('logger.member.hoisted_role_change')}`);

    let removedText = '';
    if (old.hoistedRoleId) {
      const role = old.hoistedRole;
      if (role) {
        removedText = `<@&${old.hoistedRoleId}> (${Markup.escape.all(role.name)})`;
      } else {
        removedText = `<@&${old.hoistedRoleId}>`;
      }
    }

    if (member.hoistedRoleId) {
      // added or updated
      let addedText = '';
      if (member.hoistedRoleId) {
        const role = member.hoistedRole;
        if (role) {
          addedText = `<@&${member.hoistedRoleId}> (${Markup.escape.all(role.name)})`;
        } else {
          addedText = `<@&${member.hoistedRoleId}>`;
        }
      }

      if (old.hoistedRoleId) {
        description.push(`-> ${translate('logger.change', {old: removedText, new: addedText})}`);
      } else {
        description.push(`-> ${translate('logger.added', {value: `${addedText}`})}`);
      }
    } else {
      // removed
      description.push(`-> ${translate('logger.removed', {value: `${removedText}`})}`);
    }
  }

  if (member.premiumSinceUnix !== old.premiumSinceUnix) {
    description.push(`- ${translate('logger.member.boost_change')}`);
    if (member.premiumSinceUnix) {
      description.push(`-> ${translate('logger.member.boosted')}`);
    } else {
      description.push(`-> ${translate('logger.member.unboosted')}`);
    }
  }

  if (member.pending !== old.pending) {
    description.push(`- ${translate('logger.member.pending_change')}`);
    if (member.pending) {
      description.push(`-> ${translate('logger.member.is_pending')}`);
    } else {
      description.push(`-> ${translate('logger.member.no_longer_pending')}`);
    }
  }

  if (member.avatar !== old.avatar) {
    description.push(`- ${translate('logger.member.avatar_change')}`);
    if (member.avatar && old.avatar) {
      description.push(`-> ${translate('logger.member.avatar_changed')}`);
    } else if (member.avatar && !old.avatar) {
      description.push(`-> ${translate('logger.member.avatar_set')}`);
    } else if (!member.avatar && old.avatar) {
      description.push(`-> ${translate('logger.member.avatar_removed')}`);
    }
  }

  if (member.banner !== old.banner) {
    description.push(`- ${translate('logger.member.banner_change')}`);
    if (member.banner && old.banner) {
      description.push(`-> ${translate('logger.member.banner_changed')}`);
    } else if (member.banner && !old.banner) {
      description.push(`-> ${translate('logger.member.banner_set')}`);
    } else if (!member.banner && old.banner) {
      description.push(`-> ${translate('logger.member.banner_removed')}`);
    }
  }

  return description;
}


export function formatGuildMemberUpdate(
  event: GuildLoggingEventGuildMemberUpdate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;
  const { shard } = event.payload;

  const { avatars, member } = event.cached;

  createUserEmbed(member, embed);
  embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
  embed.setColor(EmbedColors.LOG_UPDATE);
  embed.setDescription(member.mention);

  embed.setFooter(`${translate('logger.footer.member_updated')} • ${createTimestampStringFromGuild(happened, guildId)}`);

  if (avatars) {
    const guild = shard.guilds.get(guildId);
    const maxFileSize = (guild) ? guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;

    const urls = addImageFiles(files, avatars, maxFileSize);
    if (urls.current) {
      embed.setAuthor(undefined, urls.current);
    }
    if (urls.old) {
      embed.setThumbnail(urls.old);
    }
  }

  const auditSection = getGuildMemberUpdateAuditSection(event, translator);
  if (auditSection) {
    embed.addField(auditSection.title!, auditSection.lines.join('\n'));
  }

  const changes = getGuildMemberUpdateChanges(event, translator);
  if (changes.length) {
    embed.addField(translate('logger.changes'), changes.join('\n'));
  }
}


export function formatGuildMemberUpdateComponents(
  event: GuildLoggingEventGuildMemberUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;
  const { shard } = event.payload;

  const { avatars, member } = event.cached;

  let urls: {current?: string, old?: string} = {};
  if (avatars) {
    const guild = shard.guilds.get(guildId);
    const maxFileSize = (guild) ? guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;
    urls = addImageFiles(files, avatars, maxFileSize);
  }

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  const sections: Array<ContainerSection> = [];
  const auditSection = getGuildMemberUpdateAuditSection(event, translator);
  if (auditSection) {
    sections.push(auditSection);
  }
  sections.push({title: translate('logger.changes'), lines: getGuildMemberUpdateChanges(event, translator)});
  // the changes go next to the avatar thumbnail, the footer adds the divider so there's no body
  addContainerHeader(container, createUserHeaderLines(member.id, member, translator), urls.current || member.avatarUrlFormat(null, {size: 1024}), false, sections);

  if (urls.old) {
    const images = [{description: translate('logger.member.old_server_avatar'), url: urls.old}];
    if (urls.current) {
      images.push({description: translate('logger.member.new_server_avatar'), url: urls.current});
    }
    addContainerGallery(container, images, (urls.current) ? translate('logger.member.server_avatar_old_new') : translate('logger.member.old_server_avatar'));
  }

  addContainerFooter(container, `${translate('logger.footer.member_updated')} • ${createFooterTimestamp(happened)}`);
}

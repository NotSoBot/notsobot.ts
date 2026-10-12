import { Structures } from 'detritus-client';
import { AuditLogActions, AuditLogChangeKeys, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { createTimestampMomentFromGuild, createTimestampStringFromGuild, createUserEmbed, createUserString } from '../../../utils';

import {
  ContainerSection,
  addContainerBody,
  addContainerFooter,
  addContainerGallery,
  addContainerHeader,
  addImageFiles,
  createUserHeaderLines,
} from './tools';
import { LogPayloadFiles, GuildLoggingEventGuildMemberAdd, GuildLoggingEventGuildMemberRemove, GuildLoggingEventGuildMemberUpdate } from './types';


export function getGuildMemberAddSections(event: GuildLoggingEventGuildMemberAdd): {
  footer: string,
  information: Array<string>,
  joined: Array<string>,
  moderation: Array<string>,
} {
  const { audits, guildId, happened } = event;

  const { memberCount } = event.cached;
  const { member } = event.payload;

  let footer: string;
  if (audits) {
    footer = 'Member Added';
  } else {
    // rename this to something else so you can search for the messages
    footer = 'Member Joined';
  }
  footer = `${footer} • ${createTimestampStringFromGuild(member.joinedAtUnix || happened, guildId)}`;

  const moderation: Array<string> = [];
  if (audits) {
    const [ audit ] = audits;
    moderation.push(`**Added By**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
  }

  const information: Array<string> = [];
  information.push(`**Id**: ${Markup.codestring(member.id)}`);
  information.push(`**Bot**: ${(member.bot) ? 'Yes' : 'No'}`);
  if (memberCount) {
    information.push(`**Members**: ${(memberCount - 1).toLocaleString()} -> ${memberCount.toLocaleString()}`);
  }

  const joined: Array<string> = [];
  {
    const timestamp = createTimestampMomentFromGuild(member.createdAtUnix, guildId);
    joined.push(`**Discord**: ${timestamp.fromNow()}`);
    joined.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
  }

  return {footer, information, joined, moderation};
}


export function formatGuildMemberAdd(
  event: GuildLoggingEventGuildMemberAdd,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { member } = event.payload;

  createUserEmbed(member, embed);
  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
  embed.setDescription(member.mention);

  const { footer, information, joined, moderation } = getGuildMemberAddSections(event);
  embed.setFooter(footer);
  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }
  embed.addField('Information', information.join('\n'), true);
  embed.addField('Joined', joined.join('\n'), true);
}


export function formatGuildMemberAddComponents(
  event: GuildLoggingEventGuildMemberAdd,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { member } = event.payload;

  const { footer, information, joined, moderation } = getGuildMemberAddSections(event);

  container.setAccentColor(EmbedColors.LOG_CREATION);
  addContainerHeader(container, createUserHeaderLines(member.id, member), member.avatarUrlFormat(null, {size: 1024}));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: moderation},
    {title: 'Information', lines: information},
    {title: 'Joined', lines: joined},
  ]);
  addContainerFooter(container, footer);
}


export function getGuildMemberRemoveSections(event: GuildLoggingEventGuildMemberRemove): {
  footer: string,
  information: Array<string>,
  joined: Array<string>,
  moderation: Array<string>,
  user: Structures.User | null,
} {
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

  let text = 'Member Left';
  const moderation: Array<string> = [];
  if (audits) {
    const [ audit ] = audits;

    let userText = createUserString(audit.userId, audit.user as Structures.User);
    switch (audit.actionType) {
      case AuditLogActions.MEMBER_BAN_ADD: {
        moderation.push(`**Banned By**: ${userText}`);
        text = 'Member Banned';
      }; break;
      case AuditLogActions.MEMBER_KICK: {
        moderation.push(`**Kicked By**: ${userText}`);
        text = 'Member Kicked';
      }; break;
      default: {
        moderation.push(`**Unknown Reason**: ${userText}`);
        text = `Member Left (Unknown Reason: ${audit.actionType})`;
      };
    }
    if (audit.reason) {
      moderation.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
    }
  }
  const footer = `${text} • ${createTimestampStringFromGuild(happened, guildId)}`;

  const information: Array<string> = [];
  information.push(`**Id**: ${Markup.codestring(userId)}`);
  if (user) {
    information.push(`**Bot**: ${(user.bot) ? 'Yes' : 'No'}`);
  }
  if (memberCount) {
    information.push(`**Members**: ${(memberCount + 1).toLocaleString()} -> ${memberCount.toLocaleString()}`);
  }

  const joined: Array<string> = [];
  if (user) {
    {
      const timestamp = createTimestampMomentFromGuild(user.createdAtUnix, guildId);
      joined.push(`**Discord**: ${timestamp.fromNow()}`);
      joined.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }
    if (member && member.joinedAtUnix) {
      const timestamp = createTimestampMomentFromGuild(member.joinedAtUnix, guildId);
      joined.push(`**Guild**: ${timestamp.fromNow()}`);
      joined.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }
  }

  return {footer, information, joined, moderation, user};
}


export function formatGuildMemberRemove(
  event: GuildLoggingEventGuildMemberRemove,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { userId } = event.payload;

  const { footer, information, joined, moderation, user } = getGuildMemberRemoveSections(event);
  if (user) {
    createUserEmbed(user, embed);
    embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
  } else {
    embed.setAuthor('Unknown User');
  }
  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setDescription(`<@!${userId}>`);
  embed.setFooter(footer);

  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }
  embed.addField('Information', information.join('\n'), true);
  if (joined.length) {
    embed.addField('Joined', joined.join('\n'), true);
  }
}


export function formatGuildMemberRemoveComponents(
  event: GuildLoggingEventGuildMemberRemove,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { userId } = event.payload;

  const { footer, information, joined, moderation, user } = getGuildMemberRemoveSections(event);

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(container, createUserHeaderLines(userId, user), (user) ? user.avatarUrlFormat(null, {size: 1024}) : null);
  addContainerBody(container, [
    {title: 'Moderation Action', lines: moderation},
    {title: 'Information', lines: information},
    {title: 'Joined', lines: joined},
  ]);
  addContainerFooter(container, footer);
}


export function getGuildMemberUpdateAuditSection(event: GuildLoggingEventGuildMemberUpdate): ContainerSection | null {
  const { audits } = event;
  const { member } = event.cached;
  if (!audits) {
    return null;
  }

  const [ firstAudit ] = audits;
  const isSelf = member.id === firstAudit.userId;

  const description: Array<string> = [];
  if (!isSelf) {
    description.push(`By ${createUserString(firstAudit.userId, firstAudit.user)}`);
  }

  let reason: string | undefined;
  for (let audit of audits) {
    for (let [x, change] of audit.changes) {
      switch (change.key) {
        case AuditLogChangeKeys.COMMUNICATION_DISABLED_UNTIL: {
          description.push(`- Timeout Change`);
          if (change.newValue) {
            // must check if oldValue is newer than now to consider it a change
            if (change.oldValue && Date.now() < Date.parse(change.oldValue)) {
              description.push(`-> Timeout changed from ${change.oldValue} to ${change.newValue}`);
            } else {
              description.push(`-> Timed out until ${change.newValue}`);
            }
          } else {
            description.push(`-> Timeout Cleared`);
          }
        }; break;
        case AuditLogChangeKeys.DEAF: {
          if (change.newValue) {
            description.push(`- Deafened`);
          } else {
            description.push(`- Undeafened`);
          }
        }; break;
        case AuditLogChangeKeys.MUTE: {
          if (change.newValue) {
            description.push('- Microphone Muted');
          } else {
            description.push('- Microphone Unmuted');
          }
        }; break;
        case AuditLogChangeKeys.NICK: {
          description.push(`- Nickname Change`);
          if (change.oldValue) {
            if (change.newValue) {
              description.push(`-> **${Markup.codestring(change.oldValue)}** to **${Markup.codestring(change.newValue)}**`);
            } else {
              description.push(`-> Cleared **${Markup.codestring(change.oldValue)}**`);
            }
          } else {
            description.push(`-> Set to **${Markup.codestring(change.newValue)}**`);
          }
        }; break;
        case AuditLogChangeKeys.ROLES_ADD: {
          description.push(`- Added Roles`);
          const roles = change.newValue.map((raw: {name: string, id: string}) => {
            return `<@&${raw.id}> (${Markup.escape.all(raw.name)})`;
          });
          description.push(`-> ${roles.join(', ')}`);
        }; break;
        case AuditLogChangeKeys.ROLES_REMOVE: {
          description.push(`- Removed Roles`);
          const roles = change.newValue.map((raw: {name: string, id: string}) => {
            return `<@&${raw.id}> (${Markup.escape.all(raw.name)})`;
          });
          description.push(`-> ${roles.join(', ')}`);
        }; break;
        default: {
          description.push(`- ${change.key} Changed`);
          description.push(`-> ${Markup.escape.all(JSON.stringify(change.newValue))}`);
        };
      }
    }
    reason = audit.reason;
  }
  if (reason) {
    description.push(`**Reason**: ${Markup.codeblock(reason)}`);
  }

  return {title: (isSelf) ? 'Self-Action' : 'Moderation Action', lines: description};
}


export function getGuildMemberUpdateChanges(event: GuildLoggingEventGuildMemberUpdate): Array<string> {
  const { audits } = event;
  const { member, old } = event.cached;

  const description: Array<string> = [];

  // for non-premium guilds and when someone unboosts/boosts
  if (!audits) {
    if (member.communicationDisabledUntilUnix !== old.communicationDisabledUntilUnix) {
      description.push(`- Timeout Change`);
      if (member.communicationDisabledUntilUnix) {
        if (old.communicationDisabledUntilUnix && Date.now() < old.communicationDisabledUntilUnix) {
          description.push(`-> Timeout changed from ${old.communicationDisabledUntil} to ${member.communicationDisabledUntil}`);
        } else {
          description.push(`-> Timed out until ${member.communicationDisabledUntil}`);
        }
      } else {
        description.push(`-> Timeout Cleared`);
      }
    }

    if (member.deaf !== old.deaf || member.mute !== old.mute) {
      const text: Array<string> = [];
      if (member.deaf !== old.deaf) {
        text.push((member.deaf) ? 'Deafened' : 'Undeafened');
      }
      if (member.mute !== old.mute) {
        text.push((member.mute) ? 'Muted' : 'Unmuted');
      }
      if (text.length) {
        description.push(`- Server ${text.join(' and ')}`);
      }
    }

    if (member.nick !== old.nick) {
      description.push(`- Nickname Change`);
      if (member.nick) {
        if (old.nick) {
          description.push(`-> **${Markup.codestring(old.nick)}** to **${Markup.codestring(member.nick)}**`);
        } else {
          description.push(`-> Set to **${Markup.codestring(member.nick || '')}**`);
        }
      } else {
        description.push(`-> Cleared **${Markup.codestring(old.nick || '')}**`);
      }
    }

    if (member.hasDifference('roles', old._roles)) {
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
        description.push(`- Removed Roles`);
        description.push(`-> ${removals.join(', ')}`);
      }
      if (additions.length) {
        description.push(`- Added Roles`);
        description.push(`-> ${additions.join(', ')}`);
      }
    }
  }

  if (member.hoistedRoleId !== old.hoistedRoleId) {
    description.push('- Hoisted Role Change');

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
        description.push(`-> ${removedText} to ${addedText}`);
      } else {
        description.push(`-> Added ${addedText}`);
      }
    } else {
      // removed
      description.push(`-> Removed ${removedText}`);
    }
  }

  if (member.premiumSinceUnix !== old.premiumSinceUnix) {
    description.push('- Boost Change');
    if (member.premiumSinceUnix) {
      description.push(`-> Boosted`);
    } else {
      description.push(`-> Unboosted`);
    }
  }

  if (member.isPending !== old.isPending) {
    description.push(`- Pending Change`);
    if (member.isPending) {
      description.push('-> Is Pending');
    } else {
      description.push(`-> No longer pending`);
    }
  }

  if (member.avatar !== old.avatar) {
    description.push('- Server Avatar Change');
    if (member.avatar && old.avatar) {
      description.push('-> Changed their Server Avatar');
    } else if (member.avatar && !old.avatar) {
      description.push('-> Set their Server Avatar');
    } else if (!member.avatar && old.avatar) {
      description.push('-> Removed their Server Avatar');
    }
  }

  if (member.banner !== old.banner) {
    description.push('- Server Banner Change');
    if (member.banner && old.banner) {
      description.push('-> Changed their Server Banner');
    } else if (member.banner && !old.banner) {
      description.push('-> Set their Server Banner');
    } else if (!member.banner && old.banner) {
      description.push('-> Removed their Server Banner');
    }
  }

  return description;
}


export function formatGuildMemberUpdate(
  event: GuildLoggingEventGuildMemberUpdate,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { guildId, happened } = event;
  const { shard } = event.payload;

  const { avatars, member } = event.cached;

  createUserEmbed(member, embed);
  embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
  embed.setColor(EmbedColors.LOG_UPDATE);
  embed.setDescription(member.mention);

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`Member Updated • ${timestamp}`);
  }

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

  const auditSection = getGuildMemberUpdateAuditSection(event);
  if (auditSection) {
    embed.addField(auditSection.title!, auditSection.lines.join('\n'));
  }

  const changes = getGuildMemberUpdateChanges(event);
  if (changes.length) {
    embed.addField('Changes', changes.join('\n'));
  }
}


export function formatGuildMemberUpdateComponents(
  event: GuildLoggingEventGuildMemberUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
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
  addContainerHeader(container, createUserHeaderLines(member.id, member), urls.current || member.avatarUrlFormat(null, {size: 1024}));

  const sections: Array<ContainerSection> = [];
  const auditSection = getGuildMemberUpdateAuditSection(event);
  if (auditSection) {
    sections.push(auditSection);
  }
  sections.push({title: 'Changes', lines: getGuildMemberUpdateChanges(event)});
  addContainerBody(container, sections);

  if (urls.old) {
    const images = [{description: 'Old Server Avatar', url: urls.old}];
    if (urls.current) {
      images.push({description: 'New Server Avatar', url: urls.current});
    }
    addContainerGallery(container, images, (urls.current) ? 'Server Avatar (Old -> New)' : 'Old Server Avatar');
  }

  addContainerFooter(container, `Member Updated • ${createTimestampStringFromGuild(happened, guildId)}`);
}

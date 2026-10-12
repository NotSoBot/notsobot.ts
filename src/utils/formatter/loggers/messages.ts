import * as moment from 'moment';

import { Structures } from 'detritus-client';
import { AuditLogActions } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { createTimestampMomentFromGuild, createTimestampStringFromGuild, createUserEmbed, createUserString } from '../../../utils';

import {
  ContainerImage,
  MAX_MENTIONS,
  addContainerBody,
  addContainerFiles,
  addContainerFooter,
  addContainerGallery,
  addContainerHeader,
  createUserHeaderLines,
} from './tools';
import { LogPayloadFiles, GuildLoggingEventMessageDelete, GuildLoggingEventMessageDeleteBulk, GuildLoggingEventMessageUpdate } from './types';


export function getMessageInformationLines(
  guildId: string,
  channelId: string,
  messageId: string,
  message: Structures.Message | null | undefined,
): Array<string> {
  let timestamp: moment.Moment;
  if (message) {
    timestamp = createTimestampMomentFromGuild(message.timestampUnix, guildId);
  } else {
    timestamp = createTimestampMomentFromGuild(Snowflake.timestamp(messageId), guildId);
  }
  return [
    `**Channel**: <#${channelId}>`,
    `**Created**: ${timestamp.fromNow()}`,
    `**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`,
    `**Link**: ${Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId))}`,
  ];
}


export function getMessageAuthorHeaderLines(message: Structures.Message | null | undefined): Array<string> {
  if (message) {
    return createUserHeaderLines(message.author.id, message.author);
  }
  return ['### Unknown Author'];
}


export function getMessageDeleteSections(event: GuildLoggingEventMessageDelete): {
  attachments: Array<string>,
  content: string,
  embeds: Array<string>,
  images: Array<ContainerImage>,
  mentions: Array<string>,
  moderation: Array<string>,
  roleMentions: Array<string>,
} {
  const { audits } = event;
  const { message } = event.payload;

  const sections = {
    attachments: [] as Array<string>,
    content: '',
    embeds: [] as Array<string>,
    images: [] as Array<ContainerImage>,
    mentions: [] as Array<string>,
    moderation: [] as Array<string>,
    roleMentions: [] as Array<string>,
  };

  if (audits) {
    const [ audit ] = audits;
    sections.moderation.push(`By ${createUserString(audit.userId, audit.user as Structures.User)}`);
    if (audit.reason) {
      sections.moderation.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
    }
  }

  if (message) {
    if (message.fromSystem) {
      sections.content = Markup.codeblock(message.systemContent);
    } else if (message.content) {
      sections.content = Markup.codeblock(message.content);
    }
    if (message.attachments.length) {
      const urls = message.attachments.filter((attachment) => {
        return !!attachment.url;
      }).map((attachment) => {
        return Markup.url(attachment.filename, attachment.url as string);
      });
      if (urls.length) {
        sections.attachments.push(urls.join(', '));
      }
      for (let [, attachment] of message.attachments) {
        if (attachment.isImage && attachment.url) {
          sections.images.push({description: attachment.filename, url: attachment.url});
        }
      }
    }
    if (message.embeds.length) {
      sections.embeds.push(`${message.embeds.length} Embeds`);
    }
    if (message.mentionEveryone || message.mentions.length) {
      const text: Array<string> = [];
      if (message.mentionEveryone) {
        text.push('Everyone');
      }
      if (message.mentions.length) {
        if (MAX_MENTIONS <= message.mentions.length) {
          text.push(`${message.mentions.length.toLocaleString()} Users`);
        } else {
          text.push(message.mentions.map((user) => `**${Markup.codestring(String(user))}**`).join(', '));
        }
      }
      sections.mentions.push(`- ${text.join(', ')}`);
    }
    if (message.mentionRoles.length) {
      if (MAX_MENTIONS <= message.mentionRoles.length) {
        sections.roleMentions.push(`- ${message.mentionRoles.length.toLocaleString()} Roles`);
      } else {
        sections.roleMentions.push(`- ${message.mentionRoles.map((role, roleId) => (role) ? `**${Markup.codestring(String(role))}**` : `<@&${roleId}>`).join(', ')}`);
      }
    }
  } else {
    // message not in cache, old deletion
    sections.content = 'Content not available';
  }
  return sections;
}


export function formatMessageDelete(
  event: GuildLoggingEventMessageDelete,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { guildId, happened } = event;

  const { channelId, message, messageId } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`Message Deleted • ${timestamp}`);
  }

  if (message) {
    createUserEmbed(message.author, embed);
  } else {
    embed.setAuthor('Unknown Author');
  }
  embed.setColor(EmbedColors.LOG_DELETION);

  const sections = getMessageDeleteSections(event);
  if (sections.moderation.length) {
    embed.addField('Moderation Action', sections.moderation.join('\n'));
  }
  if (sections.content) {
    embed.setDescription(sections.content);
  }
  if (sections.attachments.length) {
    embed.addField('Attachments', sections.attachments.join('\n'));
  }
  if (sections.images.length) {
    embed.setThumbnail(sections.images[0].url);
  }
  if (sections.embeds.length) {
    embed.addField('Embeds', sections.embeds.join('\n'));
  }
  if (sections.mentions.length) {
    embed.addField('Mentions', sections.mentions.join('\n'));
  }
  if (sections.roleMentions.length) {
    embed.addField('Role Mentions', sections.roleMentions.join('\n'));
  }
  embed.addField('Information', getMessageInformationLines(guildId, channelId, messageId, message).join('\n'));
}


export function formatMessageDeleteComponents(
  event: GuildLoggingEventMessageDelete,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { guildId, happened } = event;

  const { channelId, message, messageId } = event.payload;

  const sections = getMessageDeleteSections(event);

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(
    container,
    getMessageAuthorHeaderLines(message),
    (message) ? message.author.avatarUrlFormat(null, {size: 1024}) : null,
  );
  addContainerBody(container, [
    {title: 'Moderation Action', lines: sections.moderation},
    {title: 'Content', lines: (sections.content) ? [sections.content] : []},
    {title: 'Attachments', lines: sections.attachments},
    {title: 'Embeds', lines: sections.embeds},
    {title: 'Mentions', lines: sections.mentions},
    {title: 'Role Mentions', lines: sections.roleMentions},
    {title: 'Information', lines: getMessageInformationLines(guildId, channelId, messageId, message)},
  ]);
  // the cdn urls might already be gone since the message was deleted, but it's the same as the embed thumbnail
  addContainerGallery(container, sections.images);
  addContainerFooter(container, `Message Deleted • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function getMessageDeleteBulkSections(event: GuildLoggingEventMessageDeleteBulk): {
  description: Array<string>,
  target: Structures.User | null,
} {
  const { audits } = event;
  const { amount } = event.payload;

  let target: Structures.User | null = null;
  const description: Array<string> = [
    `**Amount**: ${amount.toLocaleString()}` + '\n',
  ];
  if (audits) {
    const [ audit ] = audits;
    switch (audit.actionType) {
      case AuditLogActions.MEMBER_BAN_ADD: {
        target = audit.target as Structures.User;
        description.push(`Bulk Deletion of ${createUserString(audit.targetId, target)}'s Messages`);
        description.push(`Banned By ${createUserString(audit.userId, audit.user as Structures.User)}`);
      }; break;
      case AuditLogActions.MESSAGE_BULK_DELETE: {
        description.push(`By ${createUserString(audit.userId, audit.user as Structures.User)}`);
      }; break;
    }
    if (audit.reason) {
      description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
    }
  }
  return {description, target};
}


export function createMessageDeleteBulkFile(event: GuildLoggingEventMessageDeleteBulk): {filename: string, value: string} {
  const { messages } = event.payload;
  const value = JSON.stringify({
    messages: messages.map((message, id) => message || {id}),
  }, null, 2);
  return {filename: 'messages.json', value};
}


export function formatMessageDeleteBulk(
  event: GuildLoggingEventMessageDeleteBulk,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { happened } = event;

  const { amount, channelId, guildId } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`Message Bulk Deletion • ${timestamp}`);
  }

  embed.setAuthor(`${amount.toLocaleString()} Messages Deleted`);
  embed.setColor(EmbedColors.LOG_DELETION);

  const { description, target } = getMessageDeleteBulkSections(event);
  if (target) {
    createUserEmbed(target, embed);
  }
  embed.setDescription(description.join('\n'));

  files.push(createMessageDeleteBulkFile(event));

  embed.addField('Information', [
    `**Channel**: <#${channelId}>`,
  ].join('\n'));
}


export function formatMessageDeleteBulkComponents(
  event: GuildLoggingEventMessageDeleteBulk,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { happened } = event;

  const { amount, channelId, guildId } = event.payload;

  const { description, target } = getMessageDeleteBulkSections(event);

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(container, [
    `### ${amount.toLocaleString()} Messages Deleted`,
    (target) ? `From ${createUserString(target.id, target)}` : '',
  ], (target) ? target.avatarUrlFormat(null, {size: 1024}) : null);
  addContainerBody(container, [
    {lines: description.map((line) => line.trim())},
    {title: 'Information', lines: [`**Channel**: <#${channelId}>`]},
  ]);

  files.push(createMessageDeleteBulkFile(event));
  addContainerFiles(container, files);

  addContainerFooter(container, `Message Bulk Deletion • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function getMessageUpdateSections(event: GuildLoggingEventMessageUpdate): {
  attachments: Array<string>,
  embeds: Array<string>,
  flags: Array<string>,
  mentions: Array<string>,
} {
  const { message, old } = event.cached;
  const { differences } = event.payload;

  const sections = {
    attachments: [] as Array<string>,
    embeds: [] as Array<string>,
    flags: [] as Array<string>,
    mentions: [] as Array<string>,
  };
  if (!old || !differences) {
    return sections;
  }

  if (differences.attachments) {
    const oldUrls: Array<string> = old.attachments
      .filter((attachment) => !!attachment.url)
      .map((attachment) => {
        return Markup.url(attachment.filename, attachment.url as string);
      });

    const newUrls: Array<string> = message.attachments
      .filter((attachment) => !!attachment.url)
      .map((attachment) => {
        return Markup.url(attachment.filename, attachment.url as string);
      });

    if (newUrls.length !== oldUrls.length || !newUrls.every((url) => oldUrls.includes(url))) {
      sections.attachments.push(`- ${oldUrls.join(', ') || 'None'}`);
      sections.attachments.push(`+ ${newUrls.join(', ') || 'None'}`);
    }
  }

  if (differences.embeds) {
    sections.embeds.push(`- ${old.embeds.length} Embeds to ${message.embeds.length} Embeds`);
  }

  if (message.flags !== old.flags) {
    // assume its the embed hiding since that's the only one that can be updated by users (message replies cant be updated)
    // bot messages (a webhook message) can have a flag update though
    const hadSuppressEmbeds = old.hasFlagSuppressEmbeds;
    const hasSuppressEmbeds = message.hasFlagSuppressEmbeds;
    if (hadSuppressEmbeds && !hasSuppressEmbeds) {
      sections.flags.push('- Unsuppressed Embeds');
    } else if (!hadSuppressEmbeds && hasSuppressEmbeds) {
      sections.flags.push('- Suppressed Embeds');
    } else {
      sections.flags.push(`${old.flags} -> ${message.flags}`);
    }
  }

  if (message.mentionEveryone !== old.mentionEveryone || differences.mentions) {
    const removedText: Array<string> = [];
    const addedText: Array<string> = [];

    // maybe check content for @here?
    if (message.mentionEveryone !== old.mentionEveryone) {
      if (message.mentionEveryone) {
        addedText.push('Everyone');
      } else {
        removedText.push('Everyone');
      }
    }

    if (differences.mentions) {
      const removed = old.mentions.filter((memberOrUser) => !message.mentions.has(memberOrUser.id));
      const added = message.mentions.filter((memberOrUser) => !old.mentions.has(memberOrUser.id));

      if (MAX_MENTIONS <= removed.length) {
        removedText.push(`${removed.length.toLocaleString()} Users`);
      } else {
        removedText.push(removed.map((memberOrUser) => `**${Markup.codestring(String(memberOrUser))}**`).join(', '));
      }

      if (MAX_MENTIONS <= added.length) {
        addedText.push(`${added.length.toLocaleString()} Users`);
      } else {
        addedText.push(added.map((memberOrUser) => `**${Markup.codestring(String(memberOrUser))}**`).join(', '));
      }
    }

    sections.mentions.push(`- ${removedText.filter((x) => !!x).join(', ') || 'None'}`);
    sections.mentions.push(`+ ${addedText.filter((x) => !!x).join(', ') || 'None'}`);
  }
  return sections;
}


export function formatMessageUpdate(
  event: GuildLoggingEventMessageUpdate,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { guildId, happened } = event;

  const { message, old } = event.cached;
  const { channelId, differences, messageId } = event.payload;

  {
    const time = (message && message.isEdited) ? message.editedAtUnix : happened;
    const timestamp = createTimestampStringFromGuild(time, guildId);
    embed.setFooter(`Message Updated • ${timestamp}`);
  }

  if (message) {
    createUserEmbed(message.author, embed);
  } else {
    embed.setAuthor('Unknown Author');
  }
  embed.setColor(EmbedColors.LOG_UPDATE);

  if (old && differences) {
    if (message.content !== old.content) {
      if (old.content) {
        embed.setDescription(Markup.codeblock(old.content));
      } else {
        embed.setDescription('Empty Message');
      }
      if (message.content) {
        // do 1014 instead of 1024 to add for codeblocks
        const chunks = message.content.match(/[\s\S]{1,1014}/g) || [];
        for (let i = 0; i < chunks.length; i++) {
          embed.addField((i) ? '​' : 'New Content', Markup.codeblock(chunks[i]));
        }
      } else {
        embed.addField('New Content', 'Empty Message');
      }
    }

    const sections = getMessageUpdateSections(event);
    if (sections.attachments.length) {
      embed.addField('Attachments', sections.attachments.join('\n'));
    }
    if (sections.embeds.length) {
      embed.addField('Embeds', sections.embeds.join('\n'), true);
    }
    if (sections.flags.length) {
      embed.addField('Flags', sections.flags.join('\n'), true);
    }
    if (sections.mentions.length) {
      embed.addField('Mentions', sections.mentions.join('\n'));
    }
  } else {
    // old wasn't in cache
    embed.setDescription('Message was too old to get differences for');
  }

  embed.addField('Information', getMessageInformationLines(guildId, channelId, messageId, message).join('\n'));
}


export function formatMessageUpdateComponents(
  event: GuildLoggingEventMessageUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { guildId, happened } = event;

  const { message, old } = event.cached;
  const { channelId, differences, messageId } = event.payload;

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  addContainerHeader(
    container,
    getMessageAuthorHeaderLines(message),
    (message) ? message.author.avatarUrlFormat(null, {size: 1024}) : null,
  );

  const oldContent: Array<string> = [];
  const newContent: Array<string> = [];
  const note: Array<string> = [];
  const sections = getMessageUpdateSections(event);
  if (old && differences) {
    if (message.content !== old.content) {
      // no 1024 field limit here, so the content stays in one codeblock
      oldContent.push((old.content) ? Markup.codeblock(old.content) : 'Empty Message');
      newContent.push((message.content) ? Markup.codeblock(message.content) : 'Empty Message');
    }
  } else {
    // old wasn't in cache
    note.push('Message was too old to get differences for');
  }

  addContainerBody(container, [
    {lines: note},
    {title: 'Old Content', lines: oldContent},
    {title: 'New Content', lines: newContent},
    {title: 'Attachments', lines: sections.attachments},
    {title: 'Embeds', lines: sections.embeds},
    {title: 'Flags', lines: sections.flags},
    {title: 'Mentions', lines: sections.mentions},
    {title: 'Information', lines: getMessageInformationLines(guildId, channelId, messageId, message)},
  ]);

  const time = (message && message.isEdited) ? message.editedAtUnix : happened;
  addContainerFooter(container, `Message Updated • ${createTimestampStringFromGuild(time, guildId)}`);
}

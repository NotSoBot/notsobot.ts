import * as moment from 'moment';

import { Structures } from 'detritus-client';
import { AuditLogActions } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { createTimestampMomentFromGuild, createTimestampStringFromGuild, createUserEmbed, createUserString } from '../../../utils';

import type { Translator } from '../../i18n';
import {
  MAX_MENTIONS,
  addContainerBody,
  addContainerFiles,
  addContainerFooter,
  addContainerHeader,
  createUserHeaderLines,
} from './tools';
import { LogPayloadFiles, GuildLoggingEventMessageDelete, GuildLoggingEventMessageDeleteBulk, GuildLoggingEventMessageUpdate } from './types';


export function getMessageInformationLines(
  guildId: string,
  channelId: string,
  messageId: string,
  message: Structures.Message | null | undefined,
  translator: Translator,
): Array<string> {
  const { language, translate, translateMaybe } = translator;
  let timestamp: moment.Moment;
  if (message) {
    timestamp = createTimestampMomentFromGuild(message.timestampUnix, guildId);
  } else {
    timestamp = createTimestampMomentFromGuild(Snowflake.timestamp(messageId), guildId);
  }
  return [
    `**${translate('common.channel')}**: <#${channelId}>`,
    `**${translate('common.created')}**: ${timestamp.locale(language).fromNow()}`,
    `**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`,
    `**${translate('logger.message.link')}**: ${Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId))}`,
  ];
}


export function getMessageAuthorHeaderLines(message: Structures.Message | null | undefined, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  if (message) {
    return createUserHeaderLines(message.author.id, message.author, translator);
  }
  return [`### ${translate('logger.unknown_author')}`];
}


export function getMessageDeleteSections(event: GuildLoggingEventMessageDelete, translator: Translator): {
  attachments: Array<string>,
  content: string,
  embeds: Array<string>,
  mentions: Array<string>,
  moderation: Array<string>,
  roleMentions: Array<string>,
} {
  const { language, translate, translateMaybe } = translator;
  const { audits } = event;
  const { message } = event.payload;

  const sections = {
    attachments: [] as Array<string>,
    content: '',
    embeds: [] as Array<string>,
    mentions: [] as Array<string>,
    moderation: [] as Array<string>,
    roleMentions: [] as Array<string>,
  };

  if (audits) {
    const [ audit ] = audits;
    sections.moderation.push(translate('logger.by', {user: createUserString(audit.userId, audit.user as Structures.User)}));
    if (audit.reason) {
      sections.moderation.push(`**${translate('logger.reason')}**: ${Markup.codeblock(audit.reason)}`);
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
    }
    if (message.embeds.length) {
      sections.embeds.push(translate('logger.message.embeds_count', {count: message.embeds.length.toLocaleString(language)}));
    }
    if (message.mentionEveryone || message.mentions.length) {
      const text: Array<string> = [];
      if (message.mentionEveryone) {
        text.push(translate('logger.message.everyone'));
      }
      if (message.mentions.length) {
        if (MAX_MENTIONS <= message.mentions.length) {
          text.push(translate('logger.message.users_count', {count: message.mentions.length.toLocaleString(language)}));
        } else {
          text.push(message.mentions.map((user) => `**${Markup.codestring(String(user))}**`).join(', '));
        }
      }
      sections.mentions.push(`- ${text.join(', ')}`);
    }
    if (message.mentionRoles.length) {
      if (MAX_MENTIONS <= message.mentionRoles.length) {
        sections.roleMentions.push(`- ${translate('logger.message.roles_count', {count: message.mentionRoles.length.toLocaleString(language)})}`);
      } else {
        sections.roleMentions.push(`- ${message.mentionRoles.map((role, roleId) => (role) ? `**${Markup.codestring(String(role))}**` : `<@&${roleId}>`).join(', ')}`);
      }
    }
  } else {
    // message not in cache, old deletion
    sections.content = translate('logger.message.content_unavailable');
  }
  return sections;
}


export function formatMessageDelete(
  event: GuildLoggingEventMessageDelete,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;

  const { channelId, message, messageId } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.message_deleted')} • ${timestamp}`);
  }

  if (message) {
    createUserEmbed(message.author, embed);
  } else {
    embed.setAuthor(translate('logger.unknown_author'));
  }
  embed.setColor(EmbedColors.LOG_DELETION);

  const sections = getMessageDeleteSections(event, translator);
  if (sections.moderation.length) {
    embed.addField(translate('logger.moderation_action'), sections.moderation.join('\n'));
  }
  if (sections.content) {
    embed.setDescription(sections.content);
  }
  if (sections.attachments.length) {
    embed.addField(translate('logger.message.attachments'), sections.attachments.join('\n'));
  }
  if (sections.embeds.length) {
    embed.addField(translate('logger.message.embeds'), sections.embeds.join('\n'));
  }
  if (sections.mentions.length) {
    embed.addField(translate('logger.message.mentions'), sections.mentions.join('\n'));
  }
  if (sections.roleMentions.length) {
    embed.addField(translate('logger.message.role_mentions'), sections.roleMentions.join('\n'));
  }
  embed.addField(translate('common.information'), getMessageInformationLines(guildId, channelId, messageId, message, translator).join('\n'));
}


export function formatMessageDeleteComponents(
  event: GuildLoggingEventMessageDelete,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;

  const { channelId, message, messageId } = event.payload;

  const sections = getMessageDeleteSections(event, translator);

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(
    container,
    getMessageAuthorHeaderLines(message, translator),
    (message) ? message.author.avatarUrlFormat(null, {size: 1024}) : null,
  );
  addContainerBody(container, [
    {title: translate('logger.moderation_action'), lines: sections.moderation},
    {title: translate('logger.message.content'), lines: (sections.content) ? [sections.content] : []},
    {title: translate('logger.message.attachments'), lines: sections.attachments},
    {title: translate('logger.message.embeds'), lines: sections.embeds},
    {title: translate('logger.message.mentions'), lines: sections.mentions},
    {title: translate('logger.message.role_mentions'), lines: sections.roleMentions},
    {title: translate('common.information'), lines: getMessageInformationLines(guildId, channelId, messageId, message, translator)},
  ]);
  // no gallery, the attachment cdn urls are dead once the message is deleted and a media gallery with a dead url fails to render
  addContainerFooter(container, `${translate('logger.footer.message_deleted')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function getMessageDeleteBulkSections(event: GuildLoggingEventMessageDeleteBulk, translator: Translator): {
  description: Array<string>,
  target: Structures.User | null,
} {
  const { language, translate, translateMaybe } = translator;
  const { audits } = event;
  const { amount } = event.payload;

  let target: Structures.User | null = null;
  const description: Array<string> = [
    `**${translate('logger.message.amount')}**: ${amount.toLocaleString(language)}` + '\n',
  ];
  if (audits) {
    const [ audit ] = audits;
    switch (audit.actionType) {
      case AuditLogActions.MEMBER_BAN_ADD: {
        target = audit.target as Structures.User;
        description.push(translate('logger.message.bulk_deletion_of', {user: createUserString(audit.targetId, target)}));
        description.push(translate('logger.message.banned_by_user', {user: createUserString(audit.userId, audit.user as Structures.User)}));
      }; break;
      case AuditLogActions.MESSAGE_BULK_DELETE: {
        description.push(translate('logger.by', {user: createUserString(audit.userId, audit.user as Structures.User)}));
      }; break;
    }
    if (audit.reason) {
      description.push(`**${translate('logger.reason')}**: ${Markup.codeblock(audit.reason)}`);
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
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { happened } = event;

  const { amount, channelId, guildId } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.message_bulk_deleted')} • ${timestamp}`);
  }

  embed.setAuthor(translate('logger.message.messages_deleted', {count: amount.toLocaleString(language)}));
  embed.setColor(EmbedColors.LOG_DELETION);

  const { description, target } = getMessageDeleteBulkSections(event, translator);
  if (target) {
    createUserEmbed(target, embed);
  }
  embed.setDescription(description.join('\n'));

  files.push(createMessageDeleteBulkFile(event));

  embed.addField(translate('common.information'), [
    `**${translate('common.channel')}**: <#${channelId}>`,
  ].join('\n'));
}


export function formatMessageDeleteBulkComponents(
  event: GuildLoggingEventMessageDeleteBulk,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { happened } = event;

  const { amount, channelId, guildId } = event.payload;

  const { description, target } = getMessageDeleteBulkSections(event, translator);

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(container, [
    `### ${translate('logger.message.messages_deleted', {count: amount.toLocaleString(language)})}`,
    (target) ? translate('logger.from', {value: createUserString(target.id, target)}) : '',
  ], (target) ? target.avatarUrlFormat(null, {size: 1024}) : null);
  addContainerBody(container, [
    {lines: description.map((line) => line.trim())},
    {title: translate('common.information'), lines: [`**${translate('common.channel')}**: <#${channelId}>`]},
  ]);

  files.push(createMessageDeleteBulkFile(event));
  addContainerFiles(container, files);

  addContainerFooter(container, `${translate('logger.footer.message_bulk_deleted')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function getMessageUpdateSections(event: GuildLoggingEventMessageUpdate, translator: Translator): {
  attachments: Array<string>,
  embeds: Array<string>,
  flags: Array<string>,
  mentions: Array<string>,
} {
  const { language, translate, translateMaybe } = translator;
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
      sections.attachments.push(`- ${oldUrls.join(', ') || translate('common.none')}`);
      sections.attachments.push(`+ ${newUrls.join(', ') || translate('common.none')}`);
    }
  }

  if (differences.embeds) {
    sections.embeds.push(`- ${translate('logger.change', {old: translate('logger.message.embeds_count', {count: old.embeds.length}), new: translate('logger.message.embeds_count', {count: message.embeds.length})})}`);
  }

  if (message.flags !== old.flags) {
    // assume its the embed hiding since that's the only one that can be updated by users (message replies cant be updated)
    // bot messages (a webhook message) can have a flag update though
    const hadSuppressEmbeds = old.hasFlagSuppressEmbeds;
    const hasSuppressEmbeds = message.hasFlagSuppressEmbeds;
    if (hadSuppressEmbeds && !hasSuppressEmbeds) {
      sections.flags.push(`- ${translate('logger.message.embeds_unsuppressed')}`);
    } else if (!hadSuppressEmbeds && hasSuppressEmbeds) {
      sections.flags.push(`- ${translate('logger.message.embeds_suppressed')}`);
    } else {
      sections.flags.push(`${old.flags} -> ${message.flags}`);
    }
  }

  if (message.pinned !== old.pinned) {
    sections.flags.push(`- ${translate((message.pinned) ? 'logger.message.pinned' : 'logger.message.unpinned')}`);
  }

  if (message.mentionEveryone !== old.mentionEveryone || differences.mentions) {
    const removedText: Array<string> = [];
    const addedText: Array<string> = [];

    // maybe check content for @here?
    if (message.mentionEveryone !== old.mentionEveryone) {
      if (message.mentionEveryone) {
        addedText.push(translate('logger.message.everyone'));
      } else {
        removedText.push(translate('logger.message.everyone'));
      }
    }

    if (differences.mentions) {
      const removed = old.mentions.filter((memberOrUser) => !message.mentions.has(memberOrUser.id));
      const added = message.mentions.filter((memberOrUser) => !old.mentions.has(memberOrUser.id));

      if (MAX_MENTIONS <= removed.length) {
        removedText.push(translate('logger.message.users_count', {count: removed.length.toLocaleString(language)}));
      } else {
        removedText.push(removed.map((memberOrUser) => `**${Markup.codestring(String(memberOrUser))}**`).join(', '));
      }

      if (MAX_MENTIONS <= added.length) {
        addedText.push(translate('logger.message.users_count', {count: added.length.toLocaleString(language)}));
      } else {
        addedText.push(added.map((memberOrUser) => `**${Markup.codestring(String(memberOrUser))}**`).join(', '));
      }
    }

    sections.mentions.push(`- ${removedText.filter((x) => !!x).join(', ') || translate('common.none')}`);
    sections.mentions.push(`+ ${addedText.filter((x) => !!x).join(', ') || translate('common.none')}`);
  }
  return sections;
}


export function formatMessageUpdate(
  event: GuildLoggingEventMessageUpdate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;

  const { message, old } = event.cached;
  const { channelId, differences, messageId } = event.payload;

  {
    const time = (message && message.isEdited && !event.payload.isEmbedUpdate) ? message.editedAtUnix : happened;
    const timestamp = createTimestampStringFromGuild(time, guildId);
    embed.setFooter(`${translate('logger.footer.message_updated')} • ${timestamp}`);
  }

  if (message) {
    createUserEmbed(message.author, embed);
  } else {
    embed.setAuthor(translate('logger.unknown_author'));
  }
  embed.setColor(EmbedColors.LOG_UPDATE);

  if (old && differences) {
    if (message.content !== old.content) {
      if (old.content) {
        embed.setDescription(Markup.codeblock(old.content));
      } else {
        embed.setDescription(translate('logger.message.empty'));
      }
      if (message.content) {
        // do 1014 instead of 1024 to add for codeblocks
        const chunks = message.content.match(/[\s\S]{1,1014}/g) || [];
        for (let i = 0; i < chunks.length; i++) {
          embed.addField((i) ? '​' : translate('logger.message.new_content'), Markup.codeblock(chunks[i]));
        }
      } else {
        embed.addField(translate('logger.message.new_content'), translate('logger.message.empty'));
      }
    }

    const sections = getMessageUpdateSections(event, translator);
    if (sections.attachments.length) {
      embed.addField(translate('logger.message.attachments'), sections.attachments.join('\n'));
    }
    if (sections.embeds.length) {
      embed.addField(translate('logger.message.embeds'), sections.embeds.join('\n'), true);
    }
    if (sections.flags.length) {
      embed.addField(translate('logger.message.flags'), sections.flags.join('\n'), true);
    }
    if (sections.mentions.length) {
      embed.addField(translate('logger.message.mentions'), sections.mentions.join('\n'));
    }
  } else {
    // old wasn't in cache
    embed.setDescription(translate('logger.message.too_old'));
  }

  embed.addField(translate('common.information'), getMessageInformationLines(guildId, channelId, messageId, message, translator).join('\n'));
}


export function formatMessageUpdateComponents(
  event: GuildLoggingEventMessageUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;

  const { message, old } = event.cached;
  const { channelId, differences, messageId } = event.payload;

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  addContainerHeader(
    container,
    getMessageAuthorHeaderLines(message, translator),
    (message) ? message.author.avatarUrlFormat(null, {size: 1024}) : null,
  );

  const oldContent: Array<string> = [];
  const newContent: Array<string> = [];
  const note: Array<string> = [];
  const sections = getMessageUpdateSections(event, translator);
  if (old && differences) {
    if (message.content !== old.content) {
      // no 1024 field limit here, so the content stays in one codeblock
      oldContent.push((old.content) ? Markup.codeblock(old.content) : translate('logger.message.empty'));
      newContent.push((message.content) ? Markup.codeblock(message.content) : translate('logger.message.empty'));
    }
  } else {
    // old wasn't in cache
    note.push(translate('logger.message.too_old'));
  }

  addContainerBody(container, [
    {lines: note},
    {title: translate('logger.message.old_content'), lines: oldContent},
    {title: translate('logger.message.new_content'), lines: newContent},
    {title: translate('logger.message.attachments'), lines: sections.attachments},
    {title: translate('logger.message.embeds'), lines: sections.embeds},
    {title: translate('logger.message.flags'), lines: sections.flags},
    {title: translate('logger.message.mentions'), lines: sections.mentions},
    {title: translate('common.information'), lines: getMessageInformationLines(guildId, channelId, messageId, message, translator)},
  ]);

  const time = (message && message.isEdited && !event.payload.isEmbedUpdate) ? message.editedAtUnix : happened;
  addContainerFooter(container, `${translate('logger.footer.message_updated')} • ${createTimestampStringFromGuild(time, guildId)}`);
}

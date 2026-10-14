import { Structures } from 'detritus-client';
import { MessageComponentTypes } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import type { Translator } from '../../i18n';
import { LogPayloadFiles } from './types';


export const MAX_EMBED_DESCRIPTION_LENGTH = 4096;
export const MAX_EMBED_FIELD_VALUE_LENGTH = 1024;
// every embed in a message shares this, one embed over it makes discord reject the whole batch
export const MAX_EMBED_TOTAL_LENGTH = 6000;

// message content longer than this gets uploaded as a file instead of filling the log channel
export const MAX_LOGGED_CONTENT_LENGTH = 2000;
export const LOGGED_CONTENT_PREVIEW_LENGTH = 300;
export const MAX_MENTIONS = 10;

// components v2 limits are per message, shared between every container in the webhook request
export const MAX_COMPONENTS = 40;
export const MAX_COMPONENTS_TEXT_LENGTH = 4000;

// leave room so a few small logs can still be batched alongside a big one
export const MAX_CONTAINER_TEXT_LENGTH = 3500;

export const MAX_INLINE_CODE_LENGTH = 200;
export const MAX_INLINE_SECTION_LENGTH = 80;

export function truncate(text: string, max: number): string {
  if (max < text.length) {
    return text.slice(0, max - 3) + '...';
  }
  return text;
}

// truncate inside of a codeblock so the closing backticks are kept
export function truncateMarkdown(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  if (6 < text.length && text.startsWith('```') && text.endsWith('```')) {
    return '```' + truncate(text.slice(3, -3), Math.max(max - 6, 3)) + '```';
  }
  return truncate(text, max);
}

// discord rejects the whole webhook request if a single embed is invalid, which would drop every log in that batch
export function sanitizeEmbed(embed: Embed): Embed {
  if (embed.description) {
    embed.description = truncate(embed.description, MAX_EMBED_DESCRIPTION_LENGTH);
  }
  if (embed.fields) {
    for (let [key, field] of embed.fields) {
      if (!field.value || !field.value.trim()) {
        embed.fields.delete(key);
        continue;
      }
      field.value = truncateMarkdown(field.value, MAX_EMBED_FIELD_VALUE_LENGTH);
    }
  }

  // last resort for the 6000 total, shrink the description and then the biggest fields
  let overflow = embed.length - MAX_EMBED_TOTAL_LENGTH;
  if (0 < overflow && embed.description) {
    const max = Math.max(embed.description.length - overflow, 32);
    embed.description = truncateMarkdown(embed.description, max);
    overflow = embed.length - MAX_EMBED_TOTAL_LENGTH;
  }
  while (0 < overflow && embed.fields && embed.fields.length) {
    const largest = embed.fields.toArray().reduce((x, y) => (x.value.length < y.value.length) ? y : x);
    const max = Math.max(largest.value.length - overflow, 32);
    if (largest.value.length <= max) {
      break;
    }
    largest.value = truncateMarkdown(largest.value, max);
    overflow = embed.length - MAX_EMBED_TOTAL_LENGTH;
  }
  return embed;
}


// long message content goes into a file, the log just shows a preview and the filename
export function getLoggedContent(
  content: string,
  filename: string,
  files: LogPayloadFiles,
): string {
  if (content.length <= MAX_LOGGED_CONTENT_LENGTH) {
    return Markup.codeblock(content);
  }
  files.push({filename, value: content});
  return [
    Markup.codeblock(truncate(content, LOGGED_CONTENT_PREVIEW_LENGTH)),
    `-> ${Markup.codestring(filename)}`,
  ].join('\n');
}


export interface ContainerSection {
  lines: Array<string>,
  title?: string,
}

export interface ContainerImage {
  description?: string,
  url: string,
}


export function createUserHeaderLines(userId: string, user: Structures.User | null | undefined, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  if (user) {
    let name = Markup.url(Markup.escape.all(user.toString()), user.jumpLink);
    if (user.bot) {
      name += ` (${translate('logger.bot_tag')})`;
    }
    return [`### ${name}`, `<@${userId}>`];
  }
  return [`### ${translate('logger.unknown_user')}`, `<@${userId}>`];
}


// header with an optional thumbnail on the right, always followed by a divider
export function addContainerHeader(
  container: ComponentContainer,
  lines: Array<string>,
  thumbnailUrl?: null | string,
): void {
  const content = lines.filter((line) => !!line).join('\n');
  if (thumbnailUrl) {
    const section = container.createSection();
    section.addTextDisplay({content});
    section.setAccessoryThumbnail({media: {url: thumbnailUrl}});
  } else {
    container.addTextDisplay({content});
  }
  container.addSeparator();
}


// every section goes into one text display to keep the component count low (40 per message)
// the biggest line gets shrunk until the container fits, so a huge message edit doesn't push out the other sections
export function addContainerBody(container: ComponentContainer, sections: Array<ContainerSection>): void {
  sections = sections.filter((section) => !!section.lines.length).map((section) => {
    return {title: section.title, lines: section.lines.map(collapseCodeblock)};
  });
  if (!sections.length) {
    return;
  }

  // sections are only split by a newline, the bold titles are enough to tell them apart
  const render = () => {
    return sections.map((section) => {
      if (section.title) {
        const [ line ] = section.lines;
        // a single short value goes next to its title (`**Content**: \`a\``)
        if (section.lines.length === 1 && line.startsWith('`') && !line.startsWith('```') && line.length <= MAX_INLINE_SECTION_LENGTH) {
          return `**${section.title}**: ${line}`;
        }
        return [`**${section.title}**`, ...section.lines].join('\n');
      }
      return section.lines.join('\n');
    }).join('\n');
  };

  // leave room for the footer that comes after
  const budget = MAX_CONTAINER_TEXT_LENGTH - getComponentsInfo(container).textLength - 200;
  let content = render();
  while (budget < content.length) {
    let largest: {index: number, section: ContainerSection} | null = null;
    for (let section of sections) {
      for (let i = 0; i < section.lines.length; i++) {
        if (!largest || largest.section.lines[largest.index].length < section.lines[i].length) {
          largest = {index: i, section};
        }
      }
    }
    if (!largest) {
      break;
    }
    const line = largest.section.lines[largest.index];
    const max = Math.max(line.length - (content.length - budget), 32);
    if (line.length <= max) {
      break;
    }
    largest.section.lines[largest.index] = truncateMarkdown(line, max);
    content = render();
  }
  container.addTextDisplay({content});
}


// codeblocks have a lot of padding in text displays, so short single line ones become inline code
// works with a prefix too, like `**${translate('logger.reason')}**: ` + codeblock
export function collapseCodeblock(line: string): string {
  const match = line.match(/^([\s\S]*?)```[^\n`]*\n([^\n`]+)\n```$/);
  if (match) {
    const [ , prefix, text ] = match;
    if (!prefix.includes('```') && text.trim() && text.length <= MAX_INLINE_CODE_LENGTH) {
      return `${prefix}\`${text}\``;
    }
  }
  return line;
}


export function addContainerGallery(container: ComponentContainer, images: Array<ContainerImage>, title?: string): void {
  if (!images.length) {
    return;
  }
  if (title) {
    container.addTextDisplay({content: `**${title}**`});
  }
  const gallery = container.createMediaGallery();
  for (let image of images.slice(0, 10)) {
    gallery.addItem({description: image.description, media: {url: image.url}});
  }
}


// components v2 only shows attachments that a component references
export function addContainerFiles(container: ComponentContainer, files: LogPayloadFiles): void {
  for (let file of files) {
    container.createFile({file: {url: `attachment://${file.filename}`}});
  }
}


export function addContainerFooter(container: ComponentContainer, text: string): void {
  container.addSeparator();
  container.addTextDisplay({content: `-# ${text}`});
}


// upload the old/new images if they fit, used for avatars and role icons
export function addImageFiles(
  files: LogPayloadFiles,
  images: {current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}} | undefined,
  maxFileSize: number,
): {current?: string, old?: string} {
  const urls: {current?: string, old?: string} = {};
  if (images) {
    const total = ((images.current) ? images.current.value.length : 0) + ((images.old) ? images.old.value.length : 0);
    if (total && total < maxFileSize) {
      if (images.current) {
        urls.current = `attachment://${images.current.filename}`;
        files.push(images.current);
      }
      if (images.old) {
        urls.old = `attachment://${images.old.filename}`;
        files.push(images.old);
      }
    }
  }
  return urls;
}


// discord counts every nested component (including section accessories) towards the 40 limit
export function getComponentsInfo(container: ComponentContainer): {count: number, textLength: number} {
  const info = {count: 0, textLength: 0};
  const walk = (raw: any) => {
    if (!raw || typeof(raw) !== 'object') {
      return;
    }
    if (typeof(raw.type) === 'number') {
      info.count++;
      if (raw.type === MessageComponentTypes.TEXT_DISPLAY && typeof(raw.content) === 'string') {
        info.textLength += raw.content.length;
      }
    }
    if (Array.isArray(raw.components)) {
      raw.components.forEach(walk);
    }
    if (raw.accessory) {
      walk(raw.accessory);
    }
  };
  walk(JSON.parse(JSON.stringify(container)));
  return info;
}

import { MessageComponentButtonStyles, MessageComponentTypes } from 'detritus-client/lib/constants';

import { ZERO_WIDTH_SPACE } from '../../constants';
import { Languages, Translator, getTranslatorForLanguage } from '../i18n';

import { TagError } from './exceptions';



// server invites (discord.gg/x, discord.com/invite/x) and bot invites (discord.com/oauth2/authorize) render as cards
const REGEX_DISCORD_INVITE_LINK = /\b(discord(?:app)?)(\.(?:gg\/|com\/(?:invite\/|(?:api\/(?:v\d+\/)?)?oauth2\/authorize)))/gi;

// a zero width space after `discord` keeps the link text but stops discord from detecting it as an invite
export function breakInviteLinks(text: string): string {
  return text.replace(REGEX_DISCORD_INVITE_LINK, `$1${ZERO_WIDTH_SPACE}$2`);
}


// media in embeds/components can only point to files the tag uploads, never to an outside url
export function isAttachmentUrl(url: string): boolean {
  return url.startsWith('attachment://');
}

const DISCORD_MEDIA_HOSTS = ['cdn.discordapp.com', 'media.discordapp.net'];
// user uploaded content (or a proxy of any outside url) on discord's cdn
const DISCORD_MEDIA_BLOCKED_PATHS = ['attachments', 'ephemeral-attachments', 'external'];

// discord's own assets (avatars, icons, emojis, banners, stickers, etc) are fine, its attachments aren't
export function isDiscordAssetUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch(error) {
    return false;
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) {
    return false;
  }
  if (!DISCORD_MEDIA_HOSTS.includes(parsed.hostname)) {
    return false;
  }
  // asset paths never need encoding, so `%2e%2e`/`%2f` tricks can't reach a blocked path
  if (parsed.pathname.includes('%')) {
    return false;
  }
  const [ , root ] = parsed.pathname.toLowerCase().split('/');
  return !!root && !DISCORD_MEDIA_BLOCKED_PATHS.includes(root);
}

export function isAllowedMediaUrl(url: string): boolean {
  return isAttachmentUrl(url) || isDiscordAssetUrl(url);
}


// only checks the structure, the media urls (files, media galleries, thumbnails) are resolved and checked after by
// `resolveComponentMediaUrls()` in the tag parser
export function parseComponentFromData(
  data: Record<string, any>,
  isChildFrom?: MessageComponentTypes,
  isChildFromParameter?: 'accessory' | 'components',
  translate: Translator['translate'] = getTranslatorForLanguage(Languages.ENGLISH).translate,
): Record<string, any> {
  // `typeof null` is 'object' too, `{"components":[null]}` crashed on `data.type`
  if (!data || typeof(data) !== 'object' || Array.isArray(data)) {
    throw new TagError(translate('tagscript.components.components_must_be_objects'));
  }
  switch (data.type) {
    case MessageComponentTypes.ACTION_ROW: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new TagError(translate('tagscript.components.action_rows_must_be_a_parent_component_or'));
      }
      const actionRow: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.ACTION_ROW,
      };
      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new TagError(translate('tagscript.components.action_rows_must_contain_at_least_1_component'));
      }
      if (5 < data.components.length) {
        throw new TagError(translate('tagscript.components.action_rows_must_contain_at_most_5_component'));
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.ACTION_ROW, undefined, translate);
        actionRow.components.push(component);
      }
      // todo: add check for select menu, only 1 allowed per action row, with nothing else inside
      return actionRow;
    }; break;
    case MessageComponentTypes.BUTTON: {
      if (
        isChildFrom !== undefined &&
        (
          isChildFrom !== MessageComponentTypes.ACTION_ROW &&
          // only an action row or a section's accessory (`&&` here let buttons into a section's components)
          !(isChildFrom === MessageComponentTypes.SECTION && isChildFromParameter === 'accessory')
        )
      ) {
        throw new TagError(translate('tagscript.components.buttons_must_only_be_in_action_rows_or'));
      }
      const button: Record<string, any> = {
        style: MessageComponentButtonStyles.PRIMARY,
        type: MessageComponentTypes.BUTTON,
      };
      if ('style' in data && !isNaN(data.style) && data.style in MessageComponentButtonStyles && data.style !== MessageComponentButtonStyles.PREMIUM) {
        // todo: add better checks against MessageComponentButtonStyles since rn the enum is {...{value: key}, ...{key: value}}
        button.style = data.style;
      }
      if ('disabled' in data) {
        button.disabled = !!data.disabled;
      }
      if ('url' in data && typeof(data.url) === 'string') {
        button.url = data.url.slice(0, 512);
        button.style = MessageComponentButtonStyles.LINK;
      } else if ('label' in data && typeof(data.label) === 'string') {
        button.label = data.label.slice(0, 80);
        if (button.style === MessageComponentButtonStyles.LINK) {
          button.style = MessageComponentButtonStyles.PRIMARY;
        }
      }
      if ('emoji' in data && typeof(data.emoji) === 'object') {
        // todo: do stuff here
      }
      if ('run' in data && typeof(data.run) === 'string') {
        button.run = data.run;
      }
      if (!button.url && !button.label) {
        throw new TagError(translate('tagscript.components.buttons_must_contain_a_url_or_a_label'));
      }
      return button;
    }; break;
    case MessageComponentTypes.CONTAINER: {
      if (isChildFrom !== undefined) {
        throw new TagError(translate('tagscript.components.containers_must_be_a_parent_component_not_inside'));
      }
      const container: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.CONTAINER,
      };
      if ('accent_color' in data) {
        if (typeof(data.accent_color) === 'string') {
          try {
            // clamped like the number form, `ffffffffff` went past 0xFFFFFF
            container.accent_color = Math.min(0xFFFFFF, Math.max(0, parseInt(data.accent_color.replace(/#/, ''), 16) || 0));
          } catch(error) {
            // this should not happen, only should return NaN
          }
        } else if (typeof(data.accent_color) === 'number') {
          // is int, we want this
          container.accent_color = Math.max(0x000000, Math.min(0xFFFFFF, data.accent_color));
        } else if (typeof(data.accent_color) === 'object' && Array.isArray(data.accent_color) && data.accent_color.length === 3) {
          // is rgb
          try {
            // each channel clamped to 0-255, `[999,0,0]` used to spill into the other channels' bits
            const [r, g, b] = data.accent_color.map((x: any) => Math.max(0, Math.min(255, parseInt(x) || 0)));
            container.accent_color = (r << 16) | (g << 8) | b;
          } catch(error) {
            // this should not happen
          }
        }
      }
      if ('spoiler' in data) {
        container.spoiler = !!data.spoiler;
      }

      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new TagError(translate('tagscript.components.containers_must_contain_at_least_1_component'));
      }
      if (40 < data.components.length) {
        throw new TagError(translate('tagscript.components.containers_must_contain_at_most_40_components'));
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.CONTAINER, undefined, translate);
        container.components.push(component);
      }

      return container;
    }; break;
    case MessageComponentTypes.FILE: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new TagError(translate('tagscript.components.files_must_be_a_parent_component_or_inside'));
      }

      if (!data.file || typeof(data.file) !== 'object' || typeof(data.file.url) !== 'string' || !data.file.url) {
        throw new TagError(translate('tagscript.components.file_must_contain_a_media_object'));
      }

      const file: Record<string, any> = {
        file: {url: data.file.url},
        type: MessageComponentTypes.FILE,
      };

      if ('spoiler' in data) {
        file.spoiler = !!data.spoiler;
      }

      return file;
    }; break;
    case MessageComponentTypes.MEDIA_GALLERY: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new TagError(translate('tagscript.components.media_gallery_must_be_a_parent_component_or'));
      }
      const gallery: Record<string, any> = {
        items: [],
        type: MessageComponentTypes.MEDIA_GALLERY,
      };
      if (!Array.isArray(data.items) || !data.items.length) {
        throw new TagError(translate('tagscript.components.media_galleries_must_contain_at_least_1_item'));
      }
      if (10 < data.items.length) {
        throw new TagError(translate('tagscript.components.media_galleries_must_contain_at_most_10_items'));
      }
      for (let x of data.items) {
        if (!x || typeof(x) !== 'object') {
          throw new TagError(translate('tagscript.components.media_gallery_items_must_be_objects'));
        }
        if (!x.media || typeof(x.media) !== 'object' || typeof(x.media.url) !== 'string' || !x.media.url) {
          throw new TagError(translate('tagscript.components.media_gallery_items_must_contain_a_media_object'));
        }
        const item: Record<string, any> = {
          media: {url: x.media.url},
        };
        if ('description' in x) {
          item.description = String(x.description).slice(0, 1024);
        }
        if ('spoiler' in x) {
          item.spoiler = !!x.spoiler;
        }
        gallery.items.push(item);
      }
      return gallery;
    }; break;
    case MessageComponentTypes.SECTION: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new TagError(translate('tagscript.components.sections_must_be_a_parent_component_or_inside'));
      }
      const section: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.SECTION,
      };

      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new TagError(translate('tagscript.components.sections_must_contain_at_least_1_component'));
      }
      if (3 < data.components.length) {
        throw new TagError(translate('tagscript.components.sections_must_contain_at_most_3_components'));
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.SECTION, 'components', translate);
        section.components.push(component);
      }

      if (!data.accessory || typeof(data.accessory) !== 'object') {
        throw new TagError(translate('tagscript.components.sections_must_contain_a_valid_accessory_component'));
      }
      section.accessory = parseComponentFromData(data.accessory, MessageComponentTypes.SECTION, 'accessory', translate);

      return section;
    }; break;
    case MessageComponentTypes.SELECT_MENU: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.ACTION_ROW) {
        throw new TagError(translate('tagscript.components.select_menus_must_only_be_in_action_rows'));
      }
      const selectMenu: Record<string, any> = {
        options: [],
        type: MessageComponentTypes.SELECT_MENU,
      };
      if ('placeholder' in data && typeof(data.placeholder) === 'string') {
        selectMenu.placeholder = data.placeholder.slice(0, 150);
      }
      if ('max_values' in data && typeof(data.max_values) === 'number') {
        selectMenu.max_values = Math.max(Math.min(data.max_values, 25), 1);
      }
      if ('min_values' in data && typeof(data.min_values) === 'number') {
        selectMenu.min_values = Math.max(Math.min(data.min_values, 25), 1);
      }
      if ('run' in data && typeof(data.run) === 'string') {
        selectMenu.run = data.run;
      }

      if (!data.options || !Array.isArray(data.options) || !data.options.length) {
        throw new TagError(translate('tagscript.components.select_menu_options_must_contain_at_least_1'));
      }
      if (25 < data.options.length) {
        throw new TagError(translate('tagscript.components.select_menu_options_must_contain_at_most_25'));
      }
      for (let x of data.options) {
        if (!x || typeof(x) !== 'object') {
          throw new TagError(translate('tagscript.components.select_menu_options_need_to_be_objects'));
        }
        const options: Record<string, any> = {};
        if ('label' in x && x.label && typeof(x.label) === 'string') {
          options.label = x.label.slice(0, 100);
        }
        if ('value' in x && x.value && typeof(x.value) === 'string') {
          options.value = x.value.slice(0, 100);
        }
        if ('description' in x && x.description && typeof(x.description) === 'string') {
          options.description = x.description.slice(0, 100);
        }
        if ('emoji' in x && typeof(x.emoji) === 'object') {
          // todo: add support
        }
        if ('default' in x) {
          options.default = !!x.default;
        }
        if (!options.label || !options.value) {
          throw new TagError(translate('tagscript.components.select_menu_options_must_contain_both_a_label'));
        }
        selectMenu.options.push(options);
      }

      return selectMenu;
    }; break;
    case MessageComponentTypes.SEPARATOR: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new TagError(translate('tagscript.components.separators_must_be_a_parent_component_or_inside'));
      }
      const separator: Record<string, any> = {
        type: MessageComponentTypes.SEPARATOR,
      };
      if ('divider' in data) {
        separator.divider = !!data.divider;
      }
      if ('spacing' in data && typeof(data.spacing) === 'number') {
        if (data.spacing === 1 || data.spacing === 2) {
          separator.spacing = data.spacing;
        }
      }
      return separator;
    }; break;
    case MessageComponentTypes.TEXT_DISPLAY: {
      if (
        isChildFrom !== undefined &&
        (
          isChildFrom !== MessageComponentTypes.CONTAINER &&
          // only a container or a section's components (`&&` here let text displays be a section's accessory)
          !(isChildFrom === MessageComponentTypes.SECTION && isChildFromParameter === 'components')
        )
      ) {
        throw new TagError(translate('tagscript.components.text_displays_must_be_a_parent_component_or'));
      }
      return {
        content: breakInviteLinks(String(data.content).slice(0, 4000)),
        type: MessageComponentTypes.TEXT_DISPLAY,
      };
    }; break;
    case MessageComponentTypes.THUMBNAIL: {
      if (
        isChildFrom === undefined ||
        isChildFrom !== MessageComponentTypes.SECTION ||
        isChildFromParameter !== 'accessory'
      ) {
        throw new TagError(translate('tagscript.components.thumbnails_must_only_be_in_section_accessories'));
      }

      if (!data.media || typeof(data.media) !== 'object' || typeof(data.media.url) !== 'string' || !data.media.url) {
        throw new TagError(translate('tagscript.components.thumbnails_must_contain_a_media_object'));
      }
  
      const thumbnail: Record<string, any> = {
        media: {url: data.media.url},
        type: MessageComponentTypes.THUMBNAIL,
      };
  
      if ('description' in data) {
        thumbnail.description = String(data.description).slice(0, 1024);
      }
      if ('spoiler' in data) {
        thumbnail.spoiler = !!data.spoiler;
      }

      return thumbnail;
    }; break;
    default: {
      throw new TagError(translate('tagscript.components.tagscript_does_not_support_this_kind_of_component'));
    };
  }
}

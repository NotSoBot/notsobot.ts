import { MessageComponentButtonStyles, MessageComponentTypes } from 'detritus-client/lib/constants';

import { Languages, Translator, getTranslatorForLanguage } from '../i18n';



export function parseComponentFromData(
  data: Record<string, any>,
  isChildFrom?: MessageComponentTypes,
  isChildFromParameter?: 'accessory' | 'components',
  translate: Translator['translate'] = getTranslatorForLanguage(Languages.ENGLISH).translate,
): Record<string, any> {
  if (typeof(data) !== 'object') {
    throw new Error(translate('tagscript.components.components_must_be_objects'));
  }
  switch (data.type) {
    case MessageComponentTypes.ACTION_ROW: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new Error(translate('tagscript.components.action_rows_must_be_a_parent_component_or'));
      }
      const actionRow: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.ACTION_ROW,
      };
      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new Error(translate('tagscript.components.action_rows_must_contain_at_least_1_component'));
      }
      if (5 < data.components.length) {
        throw new Error(translate('tagscript.components.action_rows_must_contain_at_most_5_component'));
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
          (isChildFrom !== MessageComponentTypes.SECTION && isChildFromParameter !== 'accessory')
        )
      ) {
        throw new Error(translate('tagscript.components.buttons_must_only_be_in_action_rows_or'));
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
        throw new Error(translate('tagscript.components.buttons_must_contain_a_url_or_a_label'));
      }
      return button;
    }; break;
    case MessageComponentTypes.CONTAINER: {
      if (isChildFrom !== undefined) {
        throw new Error(translate('tagscript.components.containers_must_be_a_parent_component_not_inside'));
      }
      const container: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.CONTAINER,
      };
      if ('accent_color' in data) {
        if (typeof(data.accent_color) === 'string') {
          try {
            container.accent_color = parseInt(data.accent_color.replace(/#/, ''), 16) || 0;
          } catch(error) {
            // this should not happen, only should return NaN
          }
        } else if (typeof(data.accent_color) === 'number') {
          // is int, we want this
          container.accent_color = Math.max(0x000000, Math.min(0xFFFFFF, data.accent_color));
        } else if (typeof(data.accent_color) === 'object' && Array.isArray(data.accent_color) && data.accent_color.length === 3) {
          // is rgb
          try {
            const [r, g, b] = data.accent_color.map((x) => parseInt(x) || 0);
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
        throw new Error(translate('tagscript.components.containers_must_contain_at_least_1_component'));
      }
      if (40 < data.components.length) {
        throw new Error(translate('tagscript.components.containers_must_contain_at_most_40_components'));
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.CONTAINER, undefined, translate);
        container.components.push(component);
      }

      return container;
    }; break;
    case MessageComponentTypes.FILE: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new Error(translate('tagscript.components.files_must_be_a_parent_component_or_inside'));
      }

      if (!data.file || typeof(data.file) !== 'object' || !data.file.url) {
        throw new Error(translate('tagscript.components.file_must_contain_a_media_object'));
      }

      if (!data.file.url.startsWith('attachment://')) {
        throw new Error(translate('tagscript.components.file_media_object_url_must_be_an_attachment'));
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
        throw new Error(translate('tagscript.components.media_gallery_must_be_a_parent_component_or'));
      }
      const gallery: Record<string, any> = {
        items: [],
        type: MessageComponentTypes.MEDIA_GALLERY,
      };
      if (!data.items || !Array.isArray(gallery.items) || !gallery.items.length) {
        throw new Error(translate('tagscript.components.media_galleries_must_contain_at_least_1_item'));
      }
      if (10 < gallery.items.length) {
        throw new Error(translate('tagscript.components.media_galleries_must_contain_at_most_10_items'));
      }
      for (let x of data.items) {
        if (!x || typeof(x) !== 'object') {
          throw new Error(translate('tagscript.components.media_gallery_items_must_be_objects'));
        }
        if (!x.media || typeof(x.media) !== 'object' || !x.media.url) {
          throw new Error(translate('tagscript.components.media_gallery_items_must_contain_a_media_object'));
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
        throw new Error(translate('tagscript.components.sections_must_be_a_parent_component_or_inside'));
      }
      const section: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.SECTION,
      };

      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new Error(translate('tagscript.components.sections_must_contain_at_least_1_component'));
      }
      if (3 < data.components.length) {
        throw new Error(translate('tagscript.components.sections_must_contain_at_most_3_components'));
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.SECTION, 'components', translate);
        section.components.push(component);
      }

      if (!data.accessory || typeof(data.accessory) !== 'object') {
        throw new Error(translate('tagscript.components.sections_must_contain_a_valid_accessory_component'));
      }
      section.accessory = parseComponentFromData(data.accessory, MessageComponentTypes.SECTION, 'accessory', translate);

      return section;
    }; break;
    case MessageComponentTypes.SELECT_MENU: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.ACTION_ROW) {
        throw new Error(translate('tagscript.components.select_menus_must_only_be_in_action_rows'));
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
        throw new Error(translate('tagscript.components.select_menu_options_must_contain_at_least_1'));
      }
      if (25 < data.options.length) {
        throw new Error(translate('tagscript.components.select_menu_options_must_contain_at_most_25'));
      }
      for (let x of data.options) {
        if (!x || typeof(x) !== 'object') {
          throw new Error(translate('tagscript.components.select_menu_options_need_to_be_objects'));
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
          throw new Error(translate('tagscript.components.select_menu_options_must_contain_both_a_label'));
        }
        selectMenu.options.push(options);
      }

      return selectMenu;
    }; break;
    case MessageComponentTypes.SEPARATOR: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new Error(translate('tagscript.components.separators_must_be_a_parent_component_or_inside'));
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
          (isChildFrom !== MessageComponentTypes.SECTION && isChildFromParameter !== 'components')
        )
      ) {
        throw new Error(translate('tagscript.components.text_displays_must_be_a_parent_component_or'));
      }
      return {
        content: String(data.content).slice(0, 4000),
        type: MessageComponentTypes.TEXT_DISPLAY,
      };
    }; break;
    case MessageComponentTypes.THUMBNAIL: {
      if (
        isChildFrom === undefined ||
        isChildFrom !== MessageComponentTypes.SECTION ||
        isChildFromParameter !== 'accessory'
      ) {
        throw new Error(translate('tagscript.components.thumbnails_must_only_be_in_section_accessories'));
      }

      if (!data.media || typeof(data.media) !== 'object' || !data.media.url) {
        throw new Error(translate('tagscript.components.thumbnails_must_contain_a_media_object'));
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
      throw new Error(translate('tagscript.components.tagscript_does_not_support_this_kind_of_component'));
    };
  }
}

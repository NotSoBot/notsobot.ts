import { MessageComponentButtonStyles, MessageComponentTypes } from 'detritus-client/lib/constants';



export function parseComponentFromData(
  data: Record<string, any>,
  isChildFrom?: MessageComponentTypes,
  isChildFromParameter?: 'accessory' | 'components',
): Record<string, any> {
  if (typeof(data) !== 'object') {
    throw new Error('Components must be objects');
  }
  switch (data.type) {
    case MessageComponentTypes.ACTION_ROW: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new Error('Action Rows must be a Parent Component or inside of Containers');
      }
      const actionRow: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.ACTION_ROW,
      };
      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new Error('Action Rows must contain at least 1 component');
      }
      if (5 < data.components.length) {
        throw new Error('Action Rows must contain at most 5 component');
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.ACTION_ROW);
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
        throw new Error('Buttons must only be in Action Rows or Section Accessories');
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
        throw new Error('Buttons must contain a url or a label');
      }
      return button;
    }; break;
    case MessageComponentTypes.CONTAINER: {
      if (isChildFrom !== undefined) {
        throw new Error('Containers must be a Parent Component, not inside of any components');
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
        throw new Error('Containers must contain at least 1 component');
      }
      if (40 < data.components.length) {
        throw new Error('Containers must contain at most 40 components');
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.CONTAINER);
        container.components.push(component);
      }

      return container;
    }; break;
    case MessageComponentTypes.FILE: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new Error('Files must be a Parent Component or inside of Containers');
      }

      if (!data.file || typeof(data.file) !== 'object' || !data.file.url) {
        throw new Error('File must contain a Media Object');
      }

      if (!data.file.url.startsWith('attachment://')) {
        throw new Error('File Media Object url must be an attachment:// reference');
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
        throw new Error('Media Gallery must be a Parent Component or inside of Containers');
      }
      const gallery: Record<string, any> = {
        items: [],
        type: MessageComponentTypes.MEDIA_GALLERY,
      };
      if (!data.items || !Array.isArray(gallery.items) || !gallery.items.length) {
        throw new Error('Media Galleries must contain at least 1 item');
      }
      if (10 < gallery.items.length) {
        throw new Error('Media Galleries must contain at most 10 items');
      }
      for (let x of data.items) {
        if (!x || typeof(x) !== 'object') {
          throw new Error('Media Gallery items must be objects');
        }
        if (!x.media || typeof(x.media) !== 'object' || !x.media.url) {
          throw new Error('Media Gallery items must contain a Media Object');
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
        throw new Error('Sections must be a Parent Component or inside of Containers');
      }
      const section: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.SECTION,
      };

      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new Error('Sections must contain at least 1 component');
      }
      if (3 < data.components.length) {
        throw new Error('Sections must contain at most 3 components');
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, MessageComponentTypes.SECTION, 'components');
        section.components.push(component);
      }

      if (!data.accessory || typeof(data.accessory) !== 'object') {
        throw new Error('Sections must contain a valid Accessory Component');
      }
      section.accessory = parseComponentFromData(data.accessory, MessageComponentTypes.SECTION, 'accessory');

      return section;
    }; break;
    case MessageComponentTypes.SELECT_MENU: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.ACTION_ROW) {
        throw new Error('Select Menus must only be in Action Rows');
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
        throw new Error('Select Menu options must contain at least 1 option');
      }
      if (25 < data.options.length) {
        throw new Error('Select Menu options must contain at most 25 options');
      }
      for (let x of data.options) {
        if (!x || typeof(x) !== 'object') {
          throw new Error('Select Menu options need to be objects');
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
          throw new Error('Select Menu options must contain both a label and a value');
        }
        selectMenu.options.push(options);
      }

      return selectMenu;
    }; break;
    case MessageComponentTypes.SEPARATOR: {
      if (isChildFrom !== undefined && isChildFrom !== MessageComponentTypes.CONTAINER) {
        throw new Error('Separators must be a Parent Component or inside of Containers');
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
        throw new Error('Text Displays must be a Parent Component or inside of Containers/Sections');
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
        throw new Error('Thumbnails must only be in Section Accessories');
      }

      if (!data.media || typeof(data.media) !== 'object' || !data.media.url) {
        throw new Error('Thumbnails must contain a Media Object');
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
      throw new Error('TagScript does not support this kind of component yet');
    };
  }
}

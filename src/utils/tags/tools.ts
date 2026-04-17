import { MessageComponentButtonStyles, MessageComponentTypes } from 'detritus-client/lib/constants';



export function parseComponentFromData(data: Record<string, any>, isChild: boolean = false): Record<string, any> {
  switch (data.type) {
    case MessageComponentTypes.ACTION_ROW: {
      if (isChild) {
        throw new Error('Action Rows must contain only buttons or a select menu');
      }
      const actionRow: Record<string, any> = {
        components: [],
        type: MessageComponentTypes.ACTION_ROW,
      };
      if (!data.components || !Array.isArray(data.components) || !data.components.length) {
        throw new Error('ActionRows must contain at least 1 button.');
      }
      if (5 < data.components.length) {
        throw new Error('ActionRows must contain at most 5 buttons.');
      }
      for (let x of data.components) {
        const component = parseComponentFromData(x, true);
        actionRow.components.push(component);
      }
      // todo: add check for select menu, only 1 allowed per action row, with nothing else inside
      return actionRow;
    }; break;
    case MessageComponentTypes.BUTTON: {
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
    case MessageComponentTypes.SELECT_MENU: {
      const selectMenu: Record<string, any> = {
        options: [],
        type: MessageComponentTypes.SELECT_MENU,
      };
      if ('options' in data && Array.isArray(data.options)) {
        if (25 < data.options.length) {
          data.options = data.options.slice(0, 25);
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
      }
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
      if (!selectMenu.options.length) {
        throw new Error('Select Menus must contain at least one option');
      }
      return selectMenu;
    }; break;
    default: {
      if (isChild) {
        throw new Error('Action Rows must contain only buttons or a select menu');
      }
      throw new Error('TagScript does not support this kind of component');
    };
  }
}

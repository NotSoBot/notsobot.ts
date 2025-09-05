import { MessageComponentButtonStyles, MessageComponentTypes } from 'detritus-client/lib/constants';



export function parseComponentFromData(data: Record<string, any>, isChild: boolean = false): Record<string, any> {
	switch (data.type) {
    case MessageComponentTypes.ACTION_ROW: {
      if (isChild) {
        throw new Error('Action Rows must contain buttons');
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
        const button = parseComponentFromData(x, true);
        actionRow.components.push(button);
      }
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
    default: {
      if (isChild) {
        throw new Error('Action Rows must contain buttons');
      }
      throw new Error('TagScript does not support this kind of component');
    };
  }
}

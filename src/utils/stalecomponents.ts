import { MessageComponentTypes } from 'detritus-client/lib/constants';

import { MessageComponentCustomIds } from '../constants';


// a message's component or attachment as discord sent it (the interaction's raw payload), sent back the same way
export type RawComponent = Record<string, any>;
export type RawAttachment = Record<string, any>;

export interface DisabledComponents {
  // the attachments the components point at, a components v2 edit has to upload them again
  attachmentIds: Array<string>,
  components: Array<RawComponent>,
  // how many buttons and select menus were disabled by this
  disabled: number,
}

const INTERACTIVE_TYPES: Array<number> = [
  MessageComponentTypes.BUTTON,
  MessageComponentTypes.SELECT_MENU,
  MessageComponentTypes.USER_SELECT,
  MessageComponentTypes.ROLE_SELECT,
  MessageComponentTypes.MENTIONABLE_SELECT,
  MessageComponentTypes.CHANNEL_SELECT,
];


// the ones the components listener answers by their custom id alone, they work for as long as the message exists
export function isStaticCustomId(customId: string): boolean {
  for (let id of Object.values(MessageComponentCustomIds)) {
    if (customId === id || customId.startsWith(id + '.')) {
      return true;
    }
  }
  return false;
}

// one only its reply's listener answered (page buttons, pickers, confirmations). link and premium buttons have no custom
// id, they never need us
function isListenerComponent(component: RawComponent | null | undefined): boolean {
  return (
    !!component &&
    INTERACTIVE_TYPES.includes(component.type) &&
    typeof(component.custom_id) === 'string' &&
    !isStaticCustomId(component.custom_id)
  );
}

// a url without its query (discord's attachment urls are signed, the same file's can have different ones)
function urlPath(url: unknown): null | string {
  try {
    const parsed = new URL(String(url));
    return parsed.host + parsed.pathname;
  } catch(error) {
    return null;
  }
}

/**
 * A message's components with the buttons and select menus only a listener answered disabled, for a press that came in
 * after the listener was gone (the process restarted, or the edit that takes them off when it times out failed). They
 * aren't taken out: a message of only buttons would be left empty, a section can't be without its accessory. Static
 * buttons, link buttons and everything that isn't pressed stay as they were
 *
 * `attachments` are the message's, only for a components v2 message: its media that's an attachment is pointed at
 * `attachment://{filename}` again (discord sends the cdn url back) and listed in `attachmentIds`, an edit only resolves
 * those against files uploaded with it
 */
export function disableStaleComponents(
  components: Array<RawComponent>,
  attachments: Array<RawAttachment> = [],
): DisabledComponents {
  const attachmentIds = new Set<string>();
  let disabled = 0;

  const media = (item: RawComponent | null | undefined): RawComponent | null | undefined => {
    if (!item || typeof(item.url) !== 'string') {
      return item;
    }
    const path = urlPath(item.url);
    const attachment = attachments.find((x) => {
      return (item.attachment_id) ? x.id === item.attachment_id : (!!path && urlPath(x.url) === path);
    });
    if (!attachment) {
      return {url: item.url};
    }
    attachmentIds.add(attachment.id);
    return {url: `attachment://${attachment.filename}`};
  };

  const walk = (component: RawComponent): RawComponent => {
    if (!component || typeof(component) !== 'object') {
      return component;
    }
    if (isListenerComponent(component)) {
      if (component.disabled) {
        return component;
      }
      disabled++;
      return {...component, disabled: true};
    }
    switch (component.type) {
      case MessageComponentTypes.ACTION_ROW:
      case MessageComponentTypes.CONTAINER: {
        const children: Array<RawComponent> = (Array.isArray(component.components)) ? component.components : [];
        return {...component, components: children.map(walk)};
      };
      case MessageComponentTypes.SECTION: {
        return {...component, accessory: component.accessory && walk(component.accessory)};
      };
      case MessageComponentTypes.THUMBNAIL: return {...component, media: media(component.media)};
      case MessageComponentTypes.FILE: return {...component, file: media(component.file)};
      case MessageComponentTypes.MEDIA_GALLERY: {
        const items: Array<RawComponent> = (Array.isArray(component.items)) ? component.items : [];
        return {...component, items: items.map((item) => ({...item, media: media(item.media)}))};
      };
    }
    return component;
  };

  const walked = components.map(walk);
  return {attachmentIds: Array.from(attachmentIds), components: walked, disabled};
}

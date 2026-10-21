import {
  Command,
  Interaction,
  Structures,
  Utils,
} from 'detritus-client';
import {
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageComponentTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Components, ComponentContainer, ComponentContext } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import PaginatorsStore from '../stores/paginators';

import { getTranslator } from './i18n';
import { DisplayPayload, createDisplayLayout, displayPayloadFromEmbed, editOrReply, renderDisplay } from './tools';


export const MAX_PAGE = Number.MAX_SAFE_INTEGER;
export const MIN_PAGE = 1;


export enum PageButtonNames {
  CUSTOM = 'custom',
  NEXT = 'next',
  NEXT_DOUBLE = 'nextDouble',
  PREVIOUS = 'previous',
  PREVIOUS_DOUBLE = 'previousDouble',
  SHUFFLE = 'shuffle',
  STOP = 'stop',
}

export interface PageButton {
  emoji?: string | {animated?: boolean, id?: null | string, name: string},
  label?: string,
}

export const PageButtons: Record<PageButtonNames, PageButton> = Object.freeze({
  [PageButtonNames.CUSTOM]: {emoji: '<:b_custom_message:1561508445637709954>'},
  [PageButtonNames.NEXT]: {emoji: '<:b_next:1561508439027486832>'},
  [PageButtonNames.NEXT_DOUBLE]: {emoji: '<:b_next_double:1561508440306618458>'},
  [PageButtonNames.PREVIOUS]: {emoji: '<:b_previous:1561508443859452067>'},
  [PageButtonNames.PREVIOUS_DOUBLE]: {emoji: '<:b_previous_double:1561508441644736552>'},
  [PageButtonNames.SHUFFLE]: {emoji: '<:b_shuffle:1561508438012338236>'},
  [PageButtonNames.STOP]: {emoji: '<:b_stop_delete:1561508447776940062>'},//{emoji: '<:b_stop:1561508442928054383>'},
});

export type PageObject = {
  // a components v2 layout (containers, text displays, sections, media galleries, separators, files, link buttons)
  // makes the page components v2, the page buttons are added under it
  components?: Array<any>,
  content?: string,
  embeds?: Array<Utils.Embed>,
  files?: Array<RequestTypes.File>,
};

// rendered with the user's response display setting (components v2, embed, or text) like `displayReply`
export type PageDisplay = {display: DisplayPayload};

export type Page = (
  Utils.Embed |
  [Utils.Embed, Array<RequestTypes.File>] |
  PageObject |
  PageDisplay
);

export type PageMessage = Record<string, any>;

// discord's limit for components in a components v2 message, the page buttons take 6 of them
export const MAX_COMPONENTS_V2 = 40;


function addLayoutComponent(root: Components, component: any): void {
  if (component && typeof(component.toJSON) === 'function') {
    // already a component structure
    (root.components as Array<any>).push(component);
    return;
  }
  switch (component.type) {
    case MessageComponentTypes.ACTION_ROW: root.createActionRow(component); break;
    case MessageComponentTypes.CONTAINER: root.createContainer(component); break;
    case MessageComponentTypes.FILE: root.createFile(component); break;
    case MessageComponentTypes.MEDIA_GALLERY: root.createMediaGallery(component); break;
    case MessageComponentTypes.SECTION: root.createSection(component); break;
    case MessageComponentTypes.SEPARATOR: root.createSeparator(component); break;
    case MessageComponentTypes.TEXT_DISPLAY: root.createTextDisplay(component); break;
    default: {
      throw new Error(`Unsupported page component type ${component.type}`);
    };
  }
}


// puts the page buttons at the bottom of the page's last container (like the reupload button on media)
// the container is copied since a page's own container structure gets reused on every render
function moveButtonsIntoContainer(root: Components, rows: Array<any>): void {
  const children = root.components as Array<any>;
  const page = children.filter((component) => !rows.includes(component));
  const last = page[page.length - 1];
  if (!rows.length || !(last instanceof ComponentContainer)) {
    return;
  }
  const container = new ComponentContainer({
    accent_color: last.accentColor,
    components: [...last.components, ...rows],
    id: last.id,
    spoiler: last.spoiler,
  });
  page.splice(page.length - 1, 1, container);
  children.splice(0, children.length, ...page);
}


export function isPageComponentsV2(page: Page): boolean {
  return (
    typeof(page) === 'object' &&
    !Array.isArray(page) &&
    !(page instanceof Utils.Embed) &&
    'components' in page &&
    Array.isArray(page.components) &&
    !!page.components.length
  );
}

export type OnErrorCallback = (error: any, paginator: Paginator) => Promise<any> | any;
export type OnExpireCallback = (paginator: Paginator) => Promise<any> | any;
export type OnPageCallback = (page: number) => Promise<Page> | Page;
export type OnPageNumberCallback = (content: string) => Promise<number> | number;

export type PaginatorButtons = Partial<Record<PageButtonNames, PageButton>>;

export interface PaginatorOptions {
  buttons?: PaginatorButtons,
  expire?: number,
  isEphemeral?: boolean,
  message?: Structures.Message,
  page?: number,
  pageLimit?: number,
  pageSkipAmount?: number,
  pages?: Array<Page>,
  targets?: Array<Structures.Member | Structures.User | string>,

  onError?: OnErrorCallback,
  onExpire?: OnExpireCallback,
  onPage?: OnPageCallback,
  onPageNumber?: OnPageNumberCallback,
}


export class Paginator {
  readonly context: Command.Context | Interaction.InteractionContext | Structures.Message;
  readonly custom: {
    expire: number,
    isActive: boolean,
    message?: null | Structures.Message,
    timeout: Timers.Timeout,
    userId?: null | string,
  } = {
    expire: 10000,
    isActive: false,
    timeout: new Timers.Timeout(),
  };
  _isEphemeral?: boolean;
  _message: null | Structures.Message = null;
  // set once a components v2 page is sent, the message can't go back to content/embeds after
  isComponentsV2: boolean = false;

  buttons: Record<PageButtonNames, PageButton> = Object.assign({}, PageButtons);
  expires: number = 1 * (60 * 1000);
  page: number = MIN_PAGE;
  pageLimit: number = MAX_PAGE;
  pageSkipAmount: number = 10;
  pages?: Array<Page>;
  ratelimit: number = 250;
  ratelimitTimeout = new Timers.Timeout();
  stopped: boolean = false;
  targets: Array<string> = [];

  onError?: OnErrorCallback;
  onExpire?: OnExpireCallback;
  onPage?: OnPageCallback;
  onPageNumber?: OnPageNumberCallback;

  constructor(
    context: Command.Context | Interaction.InteractionContext | Structures.Message,
    options: PaginatorOptions,
  ) {
    this.context = context;
    this._message = options.message || null;

    if (options.isEphemeral !== undefined) {
      this.isEphemeral = options.isEphemeral;
    }

    if (Array.isArray(options.pages)) {
      this.pages = options.pages;
      this.pageLimit = this.pages.length;
    } else {
      if (options.pageLimit !== undefined) {
        this.pageLimit = Math.max(MIN_PAGE, Math.min(options.pageLimit, MAX_PAGE));
      }
    }

    if (options.page !== undefined) {
      this.page = Math.max(MIN_PAGE, Math.min(options.page, MAX_PAGE));
    }
    this.pageSkipAmount = Math.max(2, options.pageSkipAmount || this.pageSkipAmount);

    if (Array.isArray(options.targets)) {
      for (let target of options.targets) {
        if (typeof(target) === 'string') {
          this.targets.push(target);
        } else {
          this.targets.push(target.id);
        }
      }
    } else {
      if (context instanceof Structures.Message) {
        this.targets.push(context.author.id);
      } else {
        this.targets.push(context.userId);
      }
    }

    if (!this.targets.length) {
      throw new Error('A userId must be specified in the targets array');
    }

    const buttons: PaginatorButtons = Object.assign({}, PageButtons, options.buttons);
    for (let key in PageButtons) {
      (this.buttons as any)[key] = (buttons as any)[key];
    }

    this.onError = options.onError;
    this.onExpire = options.onExpire;
    this.onPage = options.onPage;
    this.onPageNumber = options.onPageNumber;

    Object.defineProperties(this, {
      _message: {enumerable: false},
      buttons: {enumerable: false},
      context: {enumerable: false},
      custom: {enumerable: false},
      onError: {enumerable: false},
      onExpire: {enumerable: false},
      onPage: {enumerable: false},
      onPageNumber: {enumerable: false},
    });
  }

  get components() {
    const components = new Components({
      timeout: this.expires,
      onTimeout: this.onStop.bind(this),
      run: this.onButtonPress.bind(this),
    });
    if (!this.shouldHaveComponents || this.stopped) {
      return components;
    }

    /*
    if (this.isLarge) {
      components.createButton({
        customId: PageButtonNames.PREVIOUS_DOUBLE,
        disabled: this.page === MIN_PAGE,
        ...this.buttons[PageButtonNames.PREVIOUS_DOUBLE],
      });
    }
    */

    components.createButton({
      customId: PageButtonNames.PREVIOUS,
      disabled: this.page === MIN_PAGE,
      ...this.buttons[PageButtonNames.PREVIOUS],
    });
    components.createButton({
      customId: PageButtonNames.NEXT,
      disabled: this.page === this.pageLimit,
      ...this.buttons[PageButtonNames.NEXT],
    });

    /*
    if (this.isLarge) {
      components.createButton({
        customId: PageButtonNames.NEXT_DOUBLE,
        disabled: this.page === this.pageLimit,
        ...this.buttons[PageButtonNames.NEXT_DOUBLE],
      });
    }
    */

    components.createButton({
      customId: PageButtonNames.SHUFFLE,
      ...this.buttons[PageButtonNames.SHUFFLE],
    });
    components.createButton({
      customId: PageButtonNames.CUSTOM,
      style: (this.custom.isActive) ? MessageComponentButtonStyles.DANGER : MessageComponentButtonStyles.PRIMARY,
      ...this.buttons[PageButtonNames.CUSTOM],
    });
    components.createButton({
      customId: PageButtonNames.STOP,
      style: MessageComponentButtonStyles.DANGER,
      ...this.buttons[PageButtonNames.STOP],
    });
    return components;
  }

  get channelId(): string {
    return this.context.channelId!;
  }

  get id(): string {
    if (this.context instanceof Interaction.InteractionContext) {
      return this.context.id;
    } else if (this.context instanceof Command.Context) {
      return this.context.messageId;
    } else if (this.context instanceof Structures.Message) {
      return this.context.id;
    }
    return '';
  }

  get isEphemeral(): boolean {
    if (this._isEphemeral !== undefined) {
      return this._isEphemeral;
    }
    if (this.message) {
      return this._isEphemeral = this.message.hasFlag(MessageFlags.EPHEMERAL);
    }
    return false;
  }

  set isEphemeral(isEphemeral: boolean) {
    this._isEphemeral = isEphemeral;
  }

  get isLarge(): boolean {
    return false; //this.pageSkipAmount < this.pageLimit;
  }

  get message(): null | Structures.Message {
    if (this._message) {
      return this._message;
    }
    if (this.context instanceof Interaction.InteractionContext) {
      return this._message = this.context.response;
    }
    return null;
  }

  set message(value: null | Structures.Message) {
    this._message = value;
  }

  get messageId(): string {
    return (this.message) ? this.message.id : '';
  }

  get shouldHaveComponents(): boolean {
    return this.pageLimit !== MIN_PAGE;
  }

  get randomPage(): number {
    if (this.pageLimit === MIN_PAGE) {
      return this.pageLimit;
    }
    if (this.pageLimit === 2) {
      return (this.page === MIN_PAGE) ? 2 : MIN_PAGE;
    }
    let page: number = this.page;
    while (page === this.page) {
      page = Math.ceil(Math.random() * this.pageLimit);
    }
    return page;
  }

  addPage(page: Page): Paginator {
    if (typeof(this.onPage) === 'function') {
      throw new Error('Cannot add a page when onPage is attached to the paginator');
    }
    if (!Array.isArray(this.pages)) {
      this.pages = [];
    }
    this.pages.push(page);
    this.pageLimit = this.pages.length;
    return this;
  }

  canInteract(userId: string): boolean {
    return this.targets.includes(userId) || this.context.client.isOwner(userId);
  }

  reset() {
    this.custom.timeout.stop();
    this.ratelimitTimeout.stop();
  }

  stop(clearButtons: boolean = true, context?: ComponentContext) {
    return this.onStop(null, clearButtons, context);
  }

  async clearCustomMessage(context?: ComponentContext): Promise<void> {
    this.custom.timeout.stop();
    if (this.custom.isActive) {
      if (this.custom.message) {
        if (!this.custom.message.deleted) {
          try {
            if (this.context instanceof Interaction.InteractionContext) {
              await this.context.deleteMessage(this.custom.message.id);
            } else {
              await this.custom.message.delete();
            }
          } catch(error) {

          }
        }
        this.custom.message = null;
      }
      this.custom.isActive = false;
      await this.updateButtons(context);
    }
  }

  async resolvePage(pageNumber: number): Promise<Page> {
    let page: Page | undefined;
    if (typeof(this.onPage) === 'function') {
      page = await Promise.resolve(this.onPage(pageNumber));
    } else {
      if (Array.isArray(this.pages)) {
        if ((pageNumber - 1) in this.pages) {
          page = this.pages[pageNumber - 1];
        }
      }
    }
    if (!page) {
      throw new Error(`Page ${pageNumber} not found`);
    }
    return page;
  }

  // the whole message for a page, with or without the page buttons
  async getPageMessage(pageNumber: number, withButtons: boolean = true): Promise<PageMessage> {
    const page = await this.resolvePage(pageNumber);
    const buttons = (withButtons) ? this.components : undefined;
    const buttonRows = (buttons) ? [...buttons.components] : [];

    if (typeof(page) === 'object' && !Array.isArray(page) && 'display' in page) {
      if (this.context instanceof Structures.Message) {
        throw new Error(`Page ${pageNumber} needs a command context to be displayed`);
      }
      const message = await renderDisplay(this.context, {...page.display, components: buttons});
      if (message.flags && (message.flags & MessageFlags.IS_COMPONENTS_V2) === MessageFlags.IS_COMPONENTS_V2) {
        this.isComponentsV2 = true;
        moveButtonsIntoContainer(message.components, buttonRows);
      } else if (message.embed) {
        message.embeds = [message.embed];
        delete message.embed;
      }
      return message;
    }

    let content: string | undefined;
    let embeds: Array<Utils.Embed> = [];
    let files: Array<RequestTypes.File> | undefined;
    let layout: Array<any> = [];
    if (Array.isArray(page) && page.length === 2) {
      embeds.push(page[0]);
      files = page[1];
    } else if (page instanceof Utils.Embed) {
      embeds.push(page);
    } else if (typeof(page) === 'object' && !Array.isArray(page)) {
      if ('content' in page && typeof(page.content) === 'string') {
        content = page.content;
      }
      if ('embeds' in page && Array.isArray(page.embeds)) {
        embeds = page.embeds;
      }
      if ('files' in page && Array.isArray(page.files)) {
        files = page.files;
      }
      if ('components' in page && Array.isArray(page.components)) {
        layout = page.components;
      }
    } else {
      throw new Error(`Page ${pageNumber} is invalid (2)`);
    }
    if (!embeds.length && (!files || !files.length) && !content && !layout.length) {
      throw new Error(`Page ${pageNumber} is invalid (3)`);
    }

    if (layout.length || this.isComponentsV2) {
      // once the message is components v2 it can't go back, so embed/content pages get turned into components too
      this.isComponentsV2 = true;

      const root = buttons || new Components();
      const pageRoot = new Components();
      if (content) {
        pageRoot.createTextDisplay({content: content.slice(0, 4000)});
      }
      for (let embed of embeds) {
        for (let component of createDisplayLayout(displayPayloadFromEmbed(embed)).components) {
          (pageRoot.components as Array<any>).push(component);
        }
      }
      for (let component of layout) {
        addLayoutComponent(pageRoot, component);
      }
      (root.components as Array<any>).unshift(...pageRoot.components);
      moveButtonsIntoContainer(root, buttonRows);
      return {
        allowedMentions: {parse: []},
        components: root,
        files,
        flags: MessageFlags.IS_COMPONENTS_V2,
      };
    }

    return {
      allowedMentions: {parse: []},
      components: buttons || [],
      content: content || '',
      embeds,
      files,
    };
  }

  async setPage(pageNumber: number, context?: ComponentContext): Promise<void> {
    pageNumber = Math.max(MIN_PAGE, Math.min(pageNumber, this.pageLimit));
    if (pageNumber === this.page) {
      if (context) {
        await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return;
    }
    this.page = pageNumber;

    // todo: put this on a timer
    if (context) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    }

    // `attachments: []` drops the old page's files, otherwise discord keeps them and adds the new ones on every page turn
    const message = await this.getPageMessage(this.page);
    if (context) {
      await context.editOrRespond({...message, attachments: []});
    } else if (this.context instanceof Interaction.InteractionContext) {
      await this.context.editOrRespond({...message, attachments: []});
    } else if (this.message) {
      await this.message.edit({...message, attachments: []});
    }
  }

  // only the buttons changed, components v2 has the page inside of the components so it gets sent again
  // the files get re-uploaded too, discord doesn't resolve `attachment://` against the attachments an edit keeps
  // (UNFURLED_MEDIA_ITEM_REFERENCED_ATTACHMENT_NOT_FOUND), `attachments: []` stops the old ones from piling up
  async getButtonsMessage(withButtons: boolean = true): Promise<PageMessage> {
    if (this.isComponentsV2) {
      const message = await this.getPageMessage(this.page, withButtons);
      if (message.files && message.files.length) {
        message.attachments = [];
      }
      return message;
    }
    return {allowedMentions: {parse: []}, components: (withButtons) ? this.components : []};
  }

  async updateButtons(context?: ComponentContext): Promise<void> {
    if (!this.stopped) {
      const message = await this.getButtonsMessage();
      if (context) {
        await context.editOrRespond(message);
      } else if (this.context instanceof Interaction.InteractionContext) {
        await this.context.editResponse(message);
      } else if (this.message) {
        await this.message.edit(message);
      }
    }
  }

  async onButtonPress(context: ComponentContext): Promise<void> {
    if (this.stopped) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return;
    }

    if (!this.canInteract(context.userId)) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return;
    }
    if (this.ratelimitTimeout.hasStarted) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return;
    }

    try {
      switch (context.customId) {
        case PageButtonNames.CUSTOM: {
          if (this.custom.isActive) {
            await this.clearCustomMessage(context);
          } else {
            await this.clearCustomMessage();

            this.custom.isActive = true;
            await this.updateButtons(context);
            const { translate } = await getTranslator(context);
            this.custom.message = await context.createMessage({
              content: translate('paginator.which_page'),
              flags: (this.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
            });
            this.custom.timeout.start(this.custom.expire, async () => {
              await this.clearCustomMessage();
            });
          }
        }; break;
        case PageButtonNames.NEXT: {
          await this.setPage(this.page + 1, context);
        }; break;
        case PageButtonNames.NEXT_DOUBLE: {
          if (!this.isLarge) {
            return;
          }
          await this.setPage(this.page + this.pageSkipAmount, context);
        }; break;
        case PageButtonNames.PREVIOUS: {
          await this.setPage(this.page - 1, context);
        }; break;
        case PageButtonNames.PREVIOUS_DOUBLE: {
          if (!this.isLarge) {
            return;
          }
          await this.setPage(this.page - this.pageSkipAmount, context);
        }; break;
        case PageButtonNames.SHUFFLE: {
          await this.setPage(this.randomPage, context);
        }; break;
        case PageButtonNames.STOP: {
          await this.onStop(null, true, context, true);
          if (this.context instanceof Command.Context) {
            const message = this.context.message;
            if (!message.deleted && message.canDelete) {
              try {
                await message.delete();
              } catch(error) {

              }
            }
          }
        }; break;
        default: {
          return;
        };
      }

      this.ratelimitTimeout.start(this.ratelimit, () => {});
    } catch(error) {
      if (typeof(this.onError) === 'function') {
        await Promise.resolve(this.onError(error, this));
      }
    }
  }

  async onMessage(message: Structures.Message): Promise<void> {
    if (!this.custom.isActive || !this.canInteract(message.author.id)) {
      return;
    }
    const page = parseInt(message.content);
    if (!isNaN(page)) {
      await this.clearCustomMessage();
      await this.setPage(page);
      if (message.canDelete) {
        try {
          await message.delete();
        } catch(error) {

        }
      }
    }
  }

  async onStop(error?: any, clearButtons: boolean = true, context?: ComponentContext, deleteMessage?: boolean) {
    if (PaginatorsStore.has(this.channelId)) {
      const stored = PaginatorsStore.get(this.channelId)!;
      stored.ephemeral.delete(this);
      stored.normal.delete(this);
      if (!stored.ephemeral.length && !stored.normal.length) {
        PaginatorsStore.delete(this.channelId);
      }
    }

    this.reset();
    if (!this.stopped) {
      this.stopped = true;
      try {
        if (error) {
          if (typeof(this.onError) === 'function') {
            await Promise.resolve(this.onError(error, this));
          }
        }
        if (typeof(this.onExpire) === 'function') {
          await Promise.resolve(this.onExpire(this));
        }
      } catch(error) {
        if (typeof(this.onError) === 'function') {
          await Promise.resolve(this.onError(error, this));
        }
      }

      if (deleteMessage) {
        // prefer the button press's own token, it's fresh and its `@original` is the message the button is on
        // (interaction responses aren't cached in group dms/user installs since we get no gateway events for them)
        if (context) {
          try {
            if (!context.responded) {
              await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
            }
            await context.deleteResponse();
          } catch(error) {

          }
        } else if (this.context instanceof Interaction.InteractionContext) {
          if (!this.context.responseDeleted) {
            try {
              await this.context.deleteMessage((this.message) ? this.message.id : '@original');
            } catch(error) {

            }
          }
        } else if (this.message && !this.message.deleted) {
          try {
            await this.message.delete();
          } catch(error) {

          }
        }
      } else if (clearButtons) {
        if (context) {
          // the whole page is sent again, temporarily here until they fix ephemeral message component clearing on button press
          // (inside a try so a failing page render doesn't skip the cleanup below)
          try {
            await context.editOrRespond({...(await this.getPageMessage(this.page, false)), attachments: []});
          } catch(error) {

          }
        } else if (this.context instanceof Interaction.InteractionContext && !this.message) {
          try {
            await this.context.editResponse(await this.getButtonsMessage(false));
          } catch(error) {

          }
        } else if (this.message && !this.message.deleted && this.message.components.length) {
          try {
            const message = await this.getButtonsMessage(false);
            if (this.context instanceof Interaction.InteractionContext) {
              await this.context.editMessage(this.message.id, message);
            } else {
              await this.message.edit(message);
            }
          } catch(error) {

          }
        }
      }
      try {
        await this.clearCustomMessage();
      } finally {
        this.onError = undefined;
        this.onExpire = undefined;
        this.onPage = undefined;
        this.onPageNumber = undefined;
      }
    }
  }

  async start(): Promise<Structures.Message | void> {
    if (typeof(this.onPage) !== 'function' && !(this.pages && this.pages.length)) {
      throw new Error('Paginator needs an onPage function or at least one page added to it');
    }

    if (this.isEphemeral && !(this.context instanceof Interaction.InteractionContext)) {
      this.isEphemeral = false;
    }

    // static pages are known ahead of time, if any of them are components v2 the whole paginator is
    if (Array.isArray(this.pages) && this.pages.some((page) => isPageComponentsV2(page))) {
      this.isComponentsV2 = true;
    }

    let message: Structures.Message | null = null;
    if (this.context instanceof Interaction.InteractionContext) {
      const pageMessage = await this.getPageMessage(this.page);
      if (this.isEphemeral) {
        pageMessage.flags = (pageMessage.flags || 0) | MessageFlags.EPHEMERAL;
      }
      await this.context.editOrRespond(pageMessage);
      message = this.message;
    } else if (this.message) {
      message = this.message;
      if (message.canEdit) {
        const pageMessage = await this.getPageMessage(this.page);
        message = this.message = await message.edit({...pageMessage, attachments: []});
      }
    } else {
      if (!this.context.canReply) {
        throw new Error('Cannot create messages in this channel');
      }

      const pageMessage = await this.getPageMessage(this.page);
      if (this.context instanceof Command.Context) {
        message = this._message = await editOrReply(this.context, pageMessage);
      } else {
        message = this._message = await this.context.reply(pageMessage);
      }
    }

    this.reset();
    if (!this.stopped && this.shouldHaveComponents) {
      if (PaginatorsStore.has(this.channelId)) {
        const stored = PaginatorsStore.get(this.channelId)!;
        for (let paginator of stored.normal) {
          if (paginator.message === message) {
            await paginator.stop(false);
          }
        }
      }
      PaginatorsStore.insert(this);
    }

    if (message) {
      return message;
    }
  }
}

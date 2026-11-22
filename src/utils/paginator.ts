import {
  Command,
  Interaction,
  Structures,
  Utils,
} from 'detritus-client';
import {
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageComponentInputTextStyles,
  MessageComponentTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import {
  Components,
  ComponentContainer,
  ComponentContext,
  ComponentSeparator,
  InteractionModal,
  InteractionModalArgs,
  InteractionModalContext,
} from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { StatusEmojis } from '../constants';
import PaginatorsStore from '../stores/paginators';

import { getTranslator, Translator } from './i18n';
import {
  DISPLAY_BLOCKS_SEPARATOR_ID,
  DISPLAY_FOOTER_SECTION_ID,
  DISPLAY_NOTE_SEPARATOR_ID,
  DisplayPayload,
  createDisplayLayout,
  displayPayloadFromEmbed,
  editOrReply,
  getMediaReplyActionsTimeout,
  isCommandRunCancelled,
  renderDisplay,
} from './tools';


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

// workspace `paginator-icons/` has their svgs. go to page is a `#`, a random page is a dice (not shuffle arrows, they read
// as shuffling a music queue)
export const PageButtons: Record<PageButtonNames, PageButton> = Object.freeze({
  [PageButtonNames.CUSTOM]: {emoji: '<:b_page_number:1563425337239404554>'},
  [PageButtonNames.NEXT]: {emoji: '<:b_next:1563425509369577492>'},
  [PageButtonNames.NEXT_DOUBLE]: {emoji: '<:b_next_double:1563425507993854083>'},
  [PageButtonNames.PREVIOUS]: {emoji: '<:b_previous:1563425512288686231>'},
  [PageButtonNames.PREVIOUS_DOUBLE]: {emoji: '<:b_previous_double:1563425511211012106>'},
  [PageButtonNames.SHUFFLE]: {emoji: '<:b_random:1563425340846776341>'},
  [PageButtonNames.STOP]: {emoji: '<:b_stop_delete:1563425514176118855>'},//{emoji: '<:b_stop:1563425515279351890>'},
});

export type PageObject = {
  // a components v2 layout (containers, text displays, sections, media galleries, separators, files, link buttons)
  // makes the page components v2, the page buttons are added under it
  components?: Array<any>,
  content?: string,
  embeds?: Array<Utils.Embed>,
  files?: Array<RequestTypes.File>,
  // the page's own action rows (like media's reupload button), above the page buttons. their clicks are handled
  // elsewhere (no `run`)
  rows?: Array<any>,
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
// the container is copied since a page's own container structure gets reused on every render. A display with a footer
// block (`footerButton`) gets the page's own rows above it and the page buttons right under it (the invoker stays last)
// `aboveNote` puts the page's own rows after its blocks instead, right above its note (`componentsAboveNote`)
function moveButtonsIntoContainer(root: Components, rows: Array<any>, pageRows: Array<any> = [], aboveNote: boolean = false): void {
  const children = root.components as Array<any>;
  const page = children.filter((component) => !rows.includes(component));
  const last = page[page.length - 1];
  if (!rows.length || !(last instanceof ComponentContainer)) {
    return;
  }
  const inner: Array<any> = [...last.components];
  const buttons = rows.filter((row) => !pageRows.includes(row));
  const findId = (id: number) => inner.findIndex((component) => component.id === id);
  // the page's own rows go above its blocks (under its content), or above the footer block's separator
  const blocks = findId(DISPLAY_BLOCKS_SEPARATOR_ID);
  const note = findId(DISPLAY_NOTE_SEPARATOR_ID);
  const footerBefore = findId(DISPLAY_FOOTER_SECTION_ID);
  let rowsAt = (0 <= blocks) ? blocks : (0 < footerBefore) ? footerBefore - 1 : inner.length;
  if (aboveNote && 0 <= note) {
    rowsAt = note;
  }
  inner.splice(rowsAt, 0, ...pageRows);
  // the page buttons right under the footer block, at the bottom otherwise
  const footer = findId(DISPLAY_FOOTER_SECTION_ID);
  if (0 < footer) {
    inner.splice(footer + 1, 0, ...(buttons.length) ? [new ComponentSeparator(), ...buttons] : []);
  } else {
    inner.push(...buttons);
  }
  const container = new ComponentContainer({
    accent_color: last.accentColor,
    components: inner,
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

// `context` is the press (or go to page submit) that failed (like a page that couldn't be made), to tell whoever pressed it why
export type PageContext = ComponentContext | InteractionModalContext;
export type OnErrorCallback = (error: any, paginator: Paginator, context?: PageContext) => Promise<any> | any;
export type OnExpireCallback = (paginator: Paginator) => Promise<any> | any;
export type OnPageCallback = (page: number) => Promise<Page> | Page;
// turns what was typed into the go to page modal into a page number (NaN for none), a plain number by default
export type OnPageNumberCallback = (content: string) => Promise<number> | number;

export type PaginatorButtons = Partial<Record<PageButtonNames, PageButton>>;

export interface PaginatorOptions {
  buttons?: PaginatorButtons,
  // stop also deletes the message that ran it (prefix), off when that message isn't a command (auto-embed's link post)
  deleteContextMessage?: boolean,
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
  _isEphemeral?: boolean;
  _message: null | Structures.Message = null;
  // set once a components v2 page is sent, the message can't go back to content/embeds after
  isComponentsV2: boolean = false;
  // the last rendered display page's own rows (like the music controls), kept with the page buttons when only they change
  pageRows: Array<any> = [];

  buttons: Record<PageButtonNames, PageButton> = Object.assign({}, PageButtons);
  deleteContextMessage: boolean = true;
  expires: number = 1 * (60 * 1000);
  // a page is being made and sent (a slow `onPage`, like a download), page presses are ignored until it's up
  loading: boolean = false;
  page: number = MIN_PAGE;
  pageLimit: number = MAX_PAGE;
  pageSkipAmount: number = 10;
  pages?: Array<Page>;
  ratelimit: number = 250;
  ratelimitTimeout = new Timers.Timeout();
  stopped: boolean = false;
  // the page edit being sent (`renderPage`), a stop waits for it before clearing the buttons
  rendering: Promise<void> | null = null;
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
    if (options.expire !== undefined) {
      this.expires = options.expire;
    }
    if (options.deleteContextMessage !== undefined) {
      this.deleteContextMessage = options.deleteContextMessage;
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
      onError: {enumerable: false},
      onExpire: {enumerable: false},
      onPage: {enumerable: false},
      onPageNumber: {enumerable: false},
    });
  }

  // an interaction's response can only be edited for 15 minutes (its token), so the buttons go a bit before that
  // instead of their cleanup failing after it (`Invalid Webhook Token`). from now, each page edit registers them again
  get componentsTimeout(): number {
    if (this.context instanceof Interaction.InteractionContext) {
      return getMediaReplyActionsTimeout(this.context, this.expires);
    }
    return this.expires;
  }

  get components() {
    const components = new Components({
      timeout: this.componentsTimeout,
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
      style: MessageComponentButtonStyles.PRIMARY,
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

  // false once the message isn't this paginator's to change anymore: its prefixed trigger was edited (re-running the
  // command into the same reply, whatever it replies with now) or deleted. stopping it then mustn't edit the message
  get ownsMessage(): boolean {
    return !(this.context instanceof Command.Context && isCommandRunCancelled(this.context));
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
    this.ratelimitTimeout.stop();
  }

  stop(clearButtons: boolean = true, context?: ComponentContext) {
    return this.onStop(null, clearButtons, context);
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
    this.pageRows = [];

    if (typeof(page) === 'object' && !Array.isArray(page) && 'display' in page) {
      if (this.context instanceof Structures.Message) {
        throw new Error(`Page ${pageNumber} needs a command context to be displayed`);
      }
      // the page's own rows go above the page buttons, their clicks are handled elsewhere (they have no `run`)
      this.pageRows = (page.display.components) ? [...page.display.components.components] : [];
      let components = buttons;
      if (this.pageRows.length) {
        components = components || new Components();
        (components.components as Array<any>).unshift(...this.pageRows);
        buttonRows.unshift(...this.pageRows);
      }
      const message = await renderDisplay(this.context, {...page.display, components, componentsInside: false});
      if (message.flags && (message.flags & MessageFlags.IS_COMPONENTS_V2) === MessageFlags.IS_COMPONENTS_V2) {
        this.isComponentsV2 = true;
        moveButtonsIntoContainer(message.components, buttonRows, this.pageRows, !!page.display.componentsAboveNote);
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
    let rows: Array<any> = [];
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
      if ('rows' in page && Array.isArray(page.rows)) {
        rows = page.rows;
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
      // the page's own rows go into its container with the page buttons under them
      this.pageRows = rows;
      (root.components as Array<any>).unshift(...pageRoot.components, ...rows);
      moveButtonsIntoContainer(root, [...rows, ...buttonRows], rows);
      return {
        allowedMentions: {parse: []},
        components: root,
        files,
        flags: MessageFlags.IS_COMPONENTS_V2,
      };
    }

    // the page's own rows stay when only the page buttons change (`getButtonsMessage`)
    this.pageRows = rows;
    let components: Components | undefined = buttons;
    if (rows.length) {
      components = components || new Components();
      (components.components as Array<any>).unshift(...rows);
    }
    return {
      allowedMentions: {parse: []},
      components: components || [],
      content: content || '',
      embeds,
      files,
    };
  }

  async setPage(pageNumber: number, context?: PageContext): Promise<void> {
    pageNumber = Math.max(MIN_PAGE, Math.min(pageNumber, this.pageLimit));
    if (pageNumber === this.page) {
      if (context) {
        await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return;
    }
    // another page is still being made (a go to page submit, the presses check it themselves)
    if (this.loading) {
      if (context && !context.responded) {
        await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return;
    }
    const previous = this.page;
    this.page = pageNumber;
    // before any await, a second press arriving while this one is answered used to see it not loading and turn the
    // page again from the page this one already moved to (skipping one), or move it while its press failed
    this.loading = true;
    try {
      if (context) {
        await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      await this.renderPage(context);
    } catch(error) {
      // the page couldn't be made or sent, the message still shows the last one (and its buttons)
      this.page = previous;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  // sends the current page again, for a page turn or when what the page shows changed (a responded to `context`)
  async renderPage(context?: PageContext): Promise<void> {
    if (!this.stopped && !this.ownsMessage) {
      // its trigger was edited or deleted, the message is the newer run's: a page now would go over its reply
      await this.stop(false);
      if (context && !context.responded) {
        await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return;
    }
    if (this.stopped) {
      return;
    }
    // `attachments: []` drops the old page's files, otherwise discord keeps them and adds the new ones on every page turn
    const message = await this.getPageMessage(this.page);
    if (this.stopped) {
      // stopped while the page was made (it expired, stop was pressed, a newer paginator replaced it), sending it would
      // put back buttons nothing listens to anymore
      if (context && !context.responded) {
        await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return;
    }
    // `editOrReply` uploads big files separately first, like every other reply
    const sending = (async () => {
      if (context) {
        await editOrReply(context, {...message, attachments: []});
      } else if (this.context instanceof Interaction.InteractionContext) {
        await editOrReply(this.context, {...message, attachments: []});
      } else if (this.message) {
        await this.message.edit({...message, attachments: []});
      }
    })();
    this.rendering = sending;
    try {
      await sending;
    } finally {
      if (this.rendering === sending) {
        this.rendering = null;
      }
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
    // a display page's own rows stay, only the page buttons come and go
    if (this.pageRows.length) {
      const components = (withButtons) ? this.components : new Components();
      (components.components as Array<any>).unshift(...this.pageRows);
      return {allowedMentions: {parse: []}, components};
    }
    return {allowedMentions: {parse: []}, components: (withButtons) ? this.components : []};
  }

  async updateButtons(context?: ComponentContext): Promise<void> {
    if (!this.stopped && !this.ownsMessage) {
      await this.stop(false);
    }
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
    // a page's own buttons (like the music controls) are answered by the components listener
    if (!(Object.values(PageButtonNames) as Array<string>).includes(context.customId)) {
      return;
    }
    if (this.stopped) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return;
    }

    if (!this.canInteract(context.userId)) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return;
    }
    // stop still works while a page loads, the page is dropped when it's done (`renderPage`)
    const isLoading = this.loading && context.customId !== PageButtonNames.STOP;
    if (this.ratelimitTimeout.hasStarted || isLoading) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return;
    }

    try {
      switch (context.customId) {
        case PageButtonNames.CUSTOM: {
          // a modal has to be the press's first response, so it isn't deferred like the others
          await context.respond(await this.createPageModal(context));
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
          if (this.context instanceof Command.Context && this.deleteContextMessage) {
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
        await Promise.resolve(this.onError(error, this, context));
      }
    }
  }

  // go to page asks in a modal, only the presser sees it and nothing gets posted in (or read from) the chat
  async createPageModal(context: ComponentContext): Promise<InteractionModal> {
    const { translate } = await getTranslator(context);
    const hasLimit = this.pageLimit !== MAX_PAGE;
    const modal = new InteractionModal({
      timeout: this.componentsTimeout,
      title: translate('paginator.go_to_page'),
      run: (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
        return this.onPageModal(modalContext, String(args.page || ''), translate);
      },
    });
    modal.createLabel({
      label: translate('paginator.page_number'),
    }).createInputText({
      customId: 'page',
      // room for a `#` in front
      maxLength: (hasLimit) ? String(this.pageLimit).length + 1 : 16,
      minLength: 1,
      placeholder: (hasLimit) ? `${this.page} / ${this.pageLimit}` : String(this.page),
      required: true,
      style: MessageComponentInputTextStyles.SHORT,
    });
    return modal;
  }

  // `translate` is the presser's, a modal submit can't look the language up itself
  async onPageModal(context: InteractionModalContext, value: string, translate: Translator['translate']): Promise<void> {
    // stopped, or another page is loading, since the modal opened
    if (this.stopped || this.loading || !this.canInteract(context.userId)) {
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return;
    }
    try {
      let page: number;
      if (typeof(this.onPageNumber) === 'function') {
        page = await Promise.resolve(this.onPageNumber(value));
      } else {
        // `#5` and `5` both work, past the last page goes to the last page (`setPage`)
        const match = value.trim().match(/^#?\s*(\d+)$/);
        page = (match) ? parseInt(match[1]) : NaN;
      }
      if (isNaN(page)) {
        await context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
          allowedMentions: {parse: []},
          content: `${StatusEmojis.WARNING} ${translate('paginator.invalid_page')}`,
          flags: MessageFlags.EPHEMERAL,
        });
        return;
      }
      await this.setPage(page, context);
      this.ratelimitTimeout.start(this.ratelimit, () => {});
    } catch(error) {
      if (typeof(this.onError) === 'function') {
        await Promise.resolve(this.onError(error, this, context));
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

      // a page edit already on its way (a big file re-uploading) landed after the clear and put back buttons nothing
      // listens to anymore, presses only acknowledged for good
      if (this.rendering) {
        await this.rendering.catch(() => null);
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
        } else if (this.message && !this.message.deleted && this.message.components.length && this.ownsMessage) {
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
      this.onError = undefined;
      this.onExpire = undefined;
      this.onPage = undefined;
      this.onPageNumber = undefined;
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
      await editOrReply(this.context, pageMessage);
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
          // the one this replaced on the same message (an edit re-ran the command into it), or one whose trigger was
          // edited or deleted since: their buttons' listener went with the newer reply (without timing out), they'd
          // only be stopped once pushed out of here, keeping their pages in memory until then
          if ((message && paginator.messageId === message.id) || !paginator.ownsMessage) {
            await paginator.stop(false);
          }
        }
      }
      // stopped during those awaits (its Stop pressed), it'd take a slot from a live one until pushed out
      if (!this.stopped) {
        PaginatorsStore.insert(this);
      }
    }

    if (message) {
      return message;
    }
  }
}

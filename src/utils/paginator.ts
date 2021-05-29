import {
  Command,
  GatewayClientEvents,
  Structures,
  Utils,
} from 'detritus-client';
import {
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageComponentTypes,
} from 'detritus-client/lib/constants';
import { ComponentActionRow } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import PaginatorsStore from '../stores/paginators';

import { editOrReply } from './tools';


export const MAX_PAGE = Number.MAX_SAFE_INTEGER;
export const MIN_PAGE = 1;


export enum PageButtonNames {
  NEXT = 'next',
  NEXT_DOUBLE = 'nextDouble',
  PREVIOUS = 'previous',
  PREVIOUS_DOUBLE = 'previousDouble',
  STOP = 'stop',
}

export const PageButtons = Object.freeze({
  [PageButtonNames.NEXT]: '>',
  [PageButtonNames.NEXT_DOUBLE]: '>>',
  [PageButtonNames.PREVIOUS]: '<',
  [PageButtonNames.PREVIOUS_DOUBLE]: '<<',
  [PageButtonNames.STOP]: '⬜',
});

export type OnErrorCallback = (error: any, paginator: Paginator) => Promise<any> | any;
export type OnExpireCallback = (paginator: Paginator) => Promise<any> | any;
export type OnPageCallback = (page: number) => Promise<Utils.Embed> | Utils.Embed;
export type OnPageNumberCallback = (content: string) => Promise<number> | number;


export interface PaginatorButtons {
  custom?: Structures.Emoji | string,
  info?: Structures.Emoji | string,
  next?: Structures.Emoji | string,
  previous?: Structures.Emoji | string,
  stop?: Structures.Emoji | string,
}

export interface PaginatorOptions {
  buttons?: PaginatorButtons,
  expire?: number,
  message?: Structures.Message,
  page?: number,
  pageLimit?: number,
  pageSkipAmount?: number,
  pages?: Array<Utils.Embed>,
  targets?: Array<Structures.Member | Structures.User | string>,

  onError?: OnErrorCallback,
  onExpire?: OnExpireCallback,
  onPage?: OnPageCallback,
  onPageNumber?: OnPageNumberCallback,
}


export class Paginator {
  readonly context: Command.Context | Structures.Message;
  readonly custom: {
    expire: number,
    message?: null | Structures.Message,
    timeout: Timers.Timeout,
    userId?: null | string,
  } = {
    expire: 10000,
    timeout: new Timers.Timeout(),
  };
  readonly timeout = new Timers.Timeout();

  buttons: Record<PageButtonNames, string | Structures.Emoji> = Object.assign({}, PageButtons);
  expires: number = 60000;
  message: null | Structures.Message = null;
  page: number = MIN_PAGE;
  pageLimit: number = MAX_PAGE;
  pageSkipAmount: number = 10;
  pages?: Array<Utils.Embed>;
  ratelimit: number = 250;
  ratelimitTimeout = new Timers.Timeout();
  stopped: boolean = false;
  targets: Array<string> = [];

  onError?: OnErrorCallback;
  onExpire?: OnExpireCallback;
  onPage?: OnPageCallback;
  onPageNumber?: OnPageNumberCallback;

  constructor(
    context: Command.Context | Structures.Message,
    options: PaginatorOptions,
  ) {
    this.context = context;
    this.message = options.message || null;

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
      let value: any = (buttons as any)[key];
      if (typeof(value) === 'object') {
        value = new Structures.Emoji(context.client, value);
      }
      if (!(value instanceof Structures.Emoji) && typeof(value) !== 'string') {
        throw new Error(`Emoji for ${key} must be a string or Emoji structure`);
      }
      (this.buttons as any)[key] = value;
    }

    this.onError = options.onError;
    this.onExpire = options.onExpire;
    this.onPage = options.onPage;
    this.onPageNumber = options.onPageNumber;

    Object.defineProperties(this, {
      buttons: {enumerable: false},
      context: {enumerable: false},
      custom: {enumerable: false},
      message: {enumerable: false},
      timeout: {enumerable: false},
      onError: {enumerable: false},
      onExpire: {enumerable: false},
      onPage: {enumerable: false},
      onPageNumber: {enumerable: false},
    });
  }

  get components() {
    const components: Array<ComponentActionRow> = [];

    {
      const actionRow = new ComponentActionRow();
      if (this.isLarge) {
        actionRow.createButton({
          customId: PageButtonNames.PREVIOUS_DOUBLE,
          disabled: this.page === MIN_PAGE,
          label: String(this.buttons[PageButtonNames.PREVIOUS_DOUBLE]),
        });
      }
      actionRow.createButton({
        customId: PageButtonNames.PREVIOUS,
        disabled: this.page === MIN_PAGE,
        label: String(this.buttons[PageButtonNames.PREVIOUS]),
      });
      actionRow.createButton({
        customId: PageButtonNames.NEXT,
        disabled: this.page === this.pageLimit,
        label: String(this.buttons[PageButtonNames.NEXT]),
      });
      if (this.isLarge) {
        actionRow.createButton({
          customId: PageButtonNames.NEXT_DOUBLE,
          disabled: this.page === this.pageLimit,
          label: String(this.buttons[PageButtonNames.NEXT_DOUBLE]),
        });
      }
      actionRow.createButton({
        customId: PageButtonNames.STOP,
        disabled: false,
        label: String(this.buttons[PageButtonNames.STOP]),
        style: MessageComponentButtonStyles.DANGER,
      });
      components.push(actionRow);
    }

    return components;
  }

  get channelId(): string {
    return this.context.channelId;
  }

  get isLarge(): boolean {
    return this.pageSkipAmount < this.pageLimit;
  }

  addPage(embed: Utils.Embed): Paginator {
    if (typeof(this.onPage) === 'function') {
      throw new Error('Cannot add a page when onPage is attached to the paginator');
    }
    if (!Array.isArray(this.pages)) {
      this.pages = [];
    }
    this.pages.push(embed);
    this.pageLimit = this.pages.length;
    return this;
  }

  reset() {
    this.timeout.stop();
    this.custom.timeout.stop();
    this.ratelimitTimeout.stop();
  }

  stop(clearButtons: boolean = true, interaction?: Structures.Interaction) {
    return this.onStop(null, clearButtons, interaction);
  }

  async getPage(page: number): Promise<Utils.Embed> {
    if (typeof(this.onPage) === 'function') {
      return await Promise.resolve(this.onPage(this.page));
    }
    if (Array.isArray(this.pages)) {
      page -= 1;
      if (page in this.pages) {
        return this.pages[page];
      }
    }
    throw new Error(`Page ${page} not found`);
  }

  async setPage(page: number, interaction: Structures.Interaction): Promise<void> {
    page = Math.max(MIN_PAGE, Math.min(page, this.pageLimit));
    if (page === this.page) {
      return await interaction.respond({type: InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE});
    }
    this.page = page;
    const embed = await this.getPage(page);
    await interaction.respond({
      data: {
        allowedMentions: {parse: []},
        components: this.components,
        embed,
      },
      type: InteractionCallbackTypes.UPDATE_MESSAGE,
    });
  }

  async onInteraction(interaction: Structures.Interaction) {
    if (this.stopped || !this.message || !interaction.message || this.message.id !== interaction.message.id || !interaction.data) {
      return;
    }
    if (!this.targets.includes(interaction.userId) && !this.context.client.isOwner(interaction.userId)) {
      return await interaction.respond({type: InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE});
    }
    if (this.ratelimitTimeout.hasStarted) {
      return await interaction.respond({type: InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE});
    }

    const data = interaction.data as Structures.InteractionDataComponent;
    try {
      switch (data.customId) {
        case PageButtonNames.NEXT: {
          await this.setPage(this.page + 1, interaction);
        }; break;
        case PageButtonNames.NEXT_DOUBLE: {
          if (!this.isLarge) {
            return;
          }
          await this.setPage(this.page + this.pageSkipAmount, interaction);
        }; break;
        case PageButtonNames.PREVIOUS: {
          await this.setPage(this.page - 1, interaction);
        }; break;
        case PageButtonNames.PREVIOUS_DOUBLE: {
          if (!this.isLarge) {
            return;
          }
          await this.setPage(this.page - this.pageSkipAmount, interaction);
        }; break;
        case PageButtonNames.STOP: {
          await this.onStop(null, true, interaction);
        }; break;
        default: {
          return;
        };
      }

      this.timeout.start(this.expires, this.onStop.bind(this));
      this.ratelimitTimeout.start(this.ratelimit, () => {});
    } catch(error) {
      if (typeof(this.onError) === 'function') {
        await Promise.resolve(this.onError(error, this));
      }
    }
  }

  async onStop(error?: any, clearButtons: boolean = true, interaction?: Structures.Interaction) {
    if (PaginatorsStore.has(this.channelId)) {
      const store = PaginatorsStore.get(this.channelId)!;
      store.delete(this);
      if (!store.length) {
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

      if (clearButtons) {
        if (interaction) {
          await interaction.respond({
            data: {allowedMentions: {parse: []}, components: []},
            type: InteractionCallbackTypes.UPDATE_MESSAGE,
          });
        } else if (this.message && !this.message.deleted && this.message.components.length) {
          try {
            await this.message.edit({components: []});
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

  async start() {
    if (typeof(this.onPage) !== 'function' && !(this.pages && this.pages.length)) {
      throw new Error('Paginator needs an onPage function or at least one page added to it');
    }

    let message: Structures.Message;
    if (this.message) {
      message = this.message;
    } else {
      if (!this.context.canReply) {
        throw new Error('Cannot create messages in this channel');
      }

      const embed = await this.getPage(this.page);
      if (this.context instanceof Command.Context) {
        message = this.message = await editOrReply(this.context, {
          components: this.components,
          embed,
        });
      } else {
        message = this.message = await this.context.reply({
          components: this.components,
          embed,
        });
      }
    }

    this.reset();
    if (!this.stopped && this.pageLimit !== MIN_PAGE) {
      if (PaginatorsStore.has(this.channelId)) {
        const stored = PaginatorsStore.get(this.channelId)!;
        for (let paginator of stored) {
          if (paginator.message === message) {
            await paginator.stop(false);
          }
        }
      }
      PaginatorsStore.insert(this);
    }

    return message;
  }
}

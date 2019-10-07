import { Command, GatewayClientEvents, Structures, Utils } from 'detritus-client';
import { Timers } from 'detritus-utils';
export declare const MAX_PAGE: number;
export declare const MIN_PAGE = 1;
export declare const PageEmojis: Readonly<{
    custom: string;
    info: string;
    next: string;
    nextDouble: string;
    previous: string;
    previousDouble: string;
    stop: string;
}>;
export declare type OnErrorCallback = (error: any, paginator: Paginator) => Promise<any> | any;
export declare type OnExpireCallback = (paginator: Paginator) => Promise<any> | any;
export declare type OnPageCallback = (page: number) => Promise<Utils.Embed> | Utils.Embed;
export declare type OnPageNumberCallback = (content: string) => Promise<number> | number;
export interface PaginatorEmojis {
    custom?: Structures.Emoji | string;
    info?: Structures.Emoji | string;
    next?: Structures.Emoji | string;
    previous?: Structures.Emoji | string;
    stop?: Structures.Emoji | string;
}
export interface PaginatorOptions {
    emojis?: PaginatorEmojis;
    expire?: number;
    message?: Structures.Message;
    page?: number;
    pageLimit?: number;
    pageSkipAmount?: number;
    pages?: Array<Utils.Embed>;
    targets?: Array<Structures.Member | Structures.User | string>;
    onError?: OnErrorCallback;
    onExpire?: OnExpireCallback;
    onPage?: OnPageCallback;
    onPageNumber?: OnPageNumberCallback;
}
export declare class Paginator {
    readonly context: Command.Context | Structures.Message;
    readonly custom: {
        expire: number;
        message?: null | Structures.Message;
        timeout: Timers.Timeout;
        userId?: null | string;
    };
    readonly timeout: Timers.Timeout;
    emojis: {
        [key: string]: Structures.Emoji;
    };
    expires: number;
    isOnGuide: boolean;
    message: null | Structures.Message;
    page: number;
    pageLimit: number;
    pageSkipAmount: number;
    pages?: Array<Utils.Embed>;
    ratelimit: number;
    ratelimitTimeout: Timers.Timeout;
    stopped: boolean;
    targets: Array<string>;
    onError?: OnErrorCallback;
    onExpire?: OnExpireCallback;
    onPage?: OnPageCallback;
    onPageNumber?: OnPageNumberCallback;
    constructor(context: Command.Context | Structures.Message, options: PaginatorOptions);
    readonly isLarge: boolean;
    addPage(embed: Utils.Embed): Paginator;
    clearCustomMessage(): Promise<void>;
    getGuidePage(): Promise<Utils.Embed>;
    getPage(page: number): Promise<Utils.Embed>;
    setPage(page: number): Promise<void>;
    onMessageReactionAdd({ messageId, reaction, userId }: GatewayClientEvents.MessageReactionAdd): Promise<void>;
    onStop(error?: any, clearEmojis?: boolean): Promise<void>;
    reset(): void;
    start(): Promise<Structures.Message>;
    stop(clearEmojis?: boolean): Promise<void>;
}

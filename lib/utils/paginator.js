"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const detritus_utils_1 = require("detritus-utils");
const { ClientEvents, DiscordRegexNames, } = detritus_client_1.Constants;
const paginators_1 = require("../stores/paginators");
exports.MAX_PAGE = Number.MAX_SAFE_INTEGER;
exports.MIN_PAGE = 1;
exports.PageEmojis = Object.freeze({
    custom: '🔢',
    info: 'ℹ',
    next: '➡',
    nextDouble: '⏭',
    previous: '⬅',
    previousDouble: '⏮',
    stop: '⏹',
});
class Paginator {
    constructor(context, options) {
        this.custom = {
            expire: 10000,
            timeout: new detritus_utils_1.Timers.Timeout(),
        };
        this.timeout = new detritus_utils_1.Timers.Timeout();
        this.emojis = {};
        this.expires = 60000;
        this.isOnGuide = false;
        this.message = null;
        this.page = exports.MIN_PAGE;
        this.pageLimit = exports.MAX_PAGE;
        this.pageSkipAmount = 10;
        this.ratelimit = 1500;
        this.ratelimitTimeout = new detritus_utils_1.Timers.Timeout();
        this.stopped = false;
        this.targets = [];
        this.context = context;
        this.message = options.message || null;
        if (Array.isArray(options.pages)) {
            this.pages = options.pages;
            this.pageLimit = this.pages.length;
        }
        else {
            if (options.pageLimit !== undefined) {
                this.pageLimit = Math.max(exports.MIN_PAGE, Math.min(options.pageLimit, exports.MAX_PAGE));
            }
        }
        if (options.page !== undefined) {
            this.page = Math.max(exports.MIN_PAGE, Math.min(options.page, exports.MAX_PAGE));
        }
        this.pageSkipAmount = Math.max(2, options.pageSkipAmount || this.pageSkipAmount);
        if (Array.isArray(options.targets)) {
            for (let target of options.targets) {
                if (typeof (target) === 'string') {
                    this.targets.push(target);
                }
                else {
                    this.targets.push(target.id);
                }
            }
        }
        else {
            if (context instanceof detritus_client_1.Structures.Message) {
                this.targets.push(context.author.id);
            }
            else {
                this.targets.push(context.userId);
            }
        }
        if (!this.targets.length) {
            throw new Error('A userId must be specified in the targets array');
        }
        const emojis = Object.assign({}, exports.PageEmojis, options.emojis);
        for (let key in exports.PageEmojis) {
            const value = emojis[key];
            if (typeof (value) === 'string') {
                let emoji;
                const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.EMOJI, value);
                if (matches.length) {
                    emoji = new detritus_client_1.Structures.Emoji(context.client, matches[0]);
                }
                else {
                    emoji = new detritus_client_1.Structures.Emoji(context.client, { name: value });
                }
                this.emojis[key] = emoji;
            }
            if (!(this.emojis[key] instanceof detritus_client_1.Structures.Emoji)) {
                throw new Error(`Emoji for ${key} must be a string or Emoji structure`);
            }
        }
        this.onError = options.onError;
        this.onExpire = options.onExpire;
        this.onPage = options.onPage;
        this.onPageNumber = options.onPageNumber;
        Object.defineProperties(this, {
            context: { enumerable: false },
            custom: { enumerable: false },
            emojis: { enumerable: false },
            message: { enumerable: false },
            timeout: { enumerable: false },
            onError: { enumerable: false },
            onExpire: { enumerable: false },
            onPage: { enumerable: false },
            onPageNumber: { enumerable: false },
        });
    }
    get isLarge() {
        return this.pageSkipAmount < this.pageLimit;
    }
    addPage(embed) {
        if (typeof (this.onPage) === 'function') {
            throw new Error('Cannot add a page when onPage is attached to the paginator');
        }
        if (!Array.isArray(this.pages)) {
            this.pages = [];
        }
        this.pages.push(embed);
        this.pageLimit = this.pages.length;
        return this;
    }
    async clearCustomMessage() {
        this.custom.timeout.stop();
        if (this.custom.message) {
            try {
                await this.custom.message.delete();
            }
            catch (error) { }
            this.custom.message = null;
        }
    }
    async getGuidePage() {
        const embed = new detritus_client_1.Utils.Embed();
        embed.setTitle('Interactive Paginator Guide');
        embed.setDescription([
            'This allows you to navigate through pages of text using reactions.\n',
            `${this.emojis.previous} - Goes back one page`,
            `${this.emojis.next} - Goes forward one page`,
            `${this.emojis.custom} - Allows you to choose a number via text`,
            `${this.emojis.stop} - Stops the paginator`,
            `${this.emojis.info} - Shows this guide`,
        ].join('\n'));
        embed.setFooter(`We were on page ${this.page.toLocaleString()}.`);
        return embed;
    }
    async getPage(page) {
        if (typeof (this.onPage) === 'function') {
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
    async setPage(page) {
        if (this.message && (this.isOnGuide || page !== this.page)) {
            this.isOnGuide = false;
            this.page = page;
            const embed = await this.getPage(page);
            await this.message.edit({ embed });
        }
    }
    async onMessageReactionAdd({ messageId, reaction, userId }) {
        if (this.stopped) {
            return;
        }
        if (!this.message || this.message.id !== messageId) {
            return;
        }
        if (!this.targets.includes(userId) && !this.context.client.isOwner(userId)) {
            return;
        }
        if (this.ratelimitTimeout.hasStarted) {
            return;
        }
        try {
            switch (reaction.emoji.endpointFormat) {
                case this.emojis.previousDouble.endpointFormat:
                    {
                        if (!this.isLarge) {
                            return;
                        }
                        const page = Math.max(this.page - this.pageSkipAmount, exports.MIN_PAGE);
                        await this.setPage(page);
                    }
                    ;
                    break;
                case this.emojis.previous.endpointFormat:
                    {
                        const page = this.page - 1;
                        if (exports.MIN_PAGE <= page) {
                            await this.setPage(page);
                        }
                    }
                    ;
                    break;
                case this.emojis.next.endpointFormat:
                    {
                        const page = this.page + 1;
                        if (page <= this.pageLimit) {
                            await this.setPage(page);
                        }
                    }
                    ;
                    break;
                case this.emojis.nextDouble.endpointFormat:
                    {
                        if (!this.isLarge) {
                            return;
                        }
                        const page = Math.min(this.page + this.pageSkipAmount, this.pageLimit);
                        await this.setPage(page);
                    }
                    ;
                    break;
                case this.emojis.custom.endpointFormat:
                    {
                        if (!this.custom.message) {
                            await this.clearCustomMessage();
                            this.custom.message = await this.message.reply('What page would you like to go to?');
                            this.custom.timeout.start(this.custom.expire, async () => {
                                await this.clearCustomMessage();
                            });
                        }
                    }
                    ;
                    break;
                case this.emojis.stop.endpointFormat:
                    {
                        await this.onStop();
                    }
                    ;
                    break;
                case this.emojis.info.endpointFormat:
                    {
                        if (!this.isOnGuide) {
                            this.isOnGuide = true;
                            const embed = await this.getGuidePage();
                            await this.message.edit({ embed });
                        }
                    }
                    ;
                    break;
                default:
                    {
                        return;
                    }
                    ;
            }
            this.timeout.start(this.expires, this.onStop.bind(this));
            this.ratelimitTimeout.start(this.ratelimit, () => { });
            if (this.message.canManage) {
                await reaction.delete(userId);
            }
        }
        catch (error) {
            if (typeof (this.onError) === 'function') {
                await Promise.resolve(this.onError(error, this));
            }
        }
    }
    async onStop(error, clearEmojis = true) {
        if (paginators_1.default.has(this.context.channelId)) {
            const paginator = paginators_1.default.get(this.context.channelId);
            if (paginator === this) {
                paginators_1.default.delete(this.context.channelId);
            }
        }
        this.reset();
        if (!this.stopped) {
            this.stopped = true;
            try {
                if (error) {
                    if (typeof (this.onError) === 'function') {
                        await Promise.resolve(this.onError(error, this));
                    }
                }
                if (typeof (this.onExpire) === 'function') {
                    await Promise.resolve(this.onExpire(this));
                }
            }
            catch (error) {
                if (typeof (this.onError) === 'function') {
                    await Promise.resolve(this.onError(error, this));
                }
            }
            if (clearEmojis) {
                if (this.message && this.message.canManage) {
                    try {
                        await this.message.deleteReactions();
                    }
                    catch (error) { }
                }
            }
            await this.clearCustomMessage();
        }
    }
    reset() {
        this.timeout.stop();
        this.custom.timeout.stop();
        this.ratelimitTimeout.stop();
    }
    async start() {
        if (typeof (this.onPage) !== 'function' && !(this.pages && this.pages.length)) {
            throw new Error('Paginator needs an onPage function or at least one page added to it');
        }
        if (!this.message) {
            if (!this.context.canReply) {
                throw new Error('Cannot create messages in this channel');
            }
            const embed = await this.getPage(this.page);
            if (this.context instanceof detritus_client_1.Command.Context) {
                this.message = await this.context.editOrReply({ embed });
            }
            else {
                this.message = await this.context.reply({ embed });
            }
        }
        this.reset();
        if (!this.stopped && this.pageLimit !== exports.MIN_PAGE && this.message.canReact) {
            if (paginators_1.default.has(this.context.channelId)) {
                const paginator = paginators_1.default.get(this.context.channelId);
                if (this.context instanceof detritus_client_1.Command.Context && this.context.response) {
                    await paginator.stop(false);
                }
                else {
                    await paginator.stop();
                }
            }
            paginators_1.default.insert(this);
            this.timeout.start(this.expires, this.onStop.bind(this));
            try {
                const emojis = [
                    (this.isLarge) ? this.emojis.previousDouble : null,
                    this.emojis.previous,
                    this.emojis.next,
                    (this.isLarge) ? this.emojis.nextDouble : null,
                    this.emojis.custom,
                    this.emojis.stop,
                    this.emojis.info,
                ].filter((v) => v);
                for (let emoji of emojis) {
                    if (this.stopped) {
                        break;
                    }
                    if (this.message.reactions.has(emoji.id || emoji.name)) {
                        continue;
                    }
                    await this.message.react(emoji.endpointFormat);
                }
            }
            catch (error) {
                if (typeof (this.onError) === 'function') {
                    this.onError(error, this);
                }
            }
        }
        return this.message;
    }
    stop(clearEmojis = true) {
        return this.onStop(null, clearEmojis);
    }
}
exports.Paginator = Paginator;

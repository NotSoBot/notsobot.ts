"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { ClientEvents } = detritus_client_1.Constants;
const paginator_1 = require("../utils/paginator");
const store_1 = require("./store");
// Stores paginators based on channel id
class PaginatorsStore extends store_1.Store {
    insert(paginator) {
        this.set(paginator.context.channelId, paginator);
    }
    create() {
        this.listeners[ClientEvents.CHANNEL_DELETE] = async (event) => {
            const { channel } = event;
            if (this.has(channel.id)) {
                const paginator = this.get(channel.id);
                this.delete(channel.id);
                paginator.message = null;
                paginator.custom.message = null;
                await paginator.stop(false);
            }
        };
        this.listeners[ClientEvents.GUILD_DELETE] = async (event) => {
            const { channels } = event;
            if (channels) {
                for (let [channelId, channel] of channels) {
                    if (this.has(channel.id)) {
                        const paginator = this.get(channel.id);
                        this.delete(channel.id);
                        paginator.message = null;
                        paginator.custom.message = null;
                        await paginator.stop(false);
                    }
                }
            }
        };
        this.listeners[ClientEvents.MESSAGE_CREATE] = async (event) => {
            const { message } = event;
            if (this.has(message.channelId)) {
                const paginator = this.get(message.channelId);
                if (paginator.custom.message && (paginator.custom.userId === message.author.id || message.author.isClientOwner)) {
                    let page = parseInt(message.content);
                    if (!isNaN(page)) {
                        page = Math.max(paginator_1.MIN_PAGE, Math.min(page, paginator.pageLimit));
                        await paginator.clearCustomMessage();
                        if (message.canDelete) {
                            try {
                                await message.delete();
                            }
                            catch (error) { }
                        }
                        await paginator.setPage(page);
                    }
                }
            }
        };
        this.listeners[ClientEvents.MESSAGE_DELETE] = async (event) => {
            const { raw } = event;
            const { channel_id: channelId, id: messageId } = raw;
            if (this.has(channelId)) {
                const paginator = this.get(channelId);
                if (paginator.message) {
                    if (paginator.message.id === messageId) {
                        this.delete(channelId);
                        paginator.message = null;
                        await paginator.stop(false);
                    }
                }
                if (paginator.custom.message) {
                    if (paginator.custom.message.id === messageId) {
                        paginator.custom.message = null;
                        await paginator.clearCustomMessage();
                    }
                }
            }
        };
        this.listeners[ClientEvents.MESSAGE_REACTION_ADD] = async (event) => {
            const { channelId } = event;
            if (this.has(channelId)) {
                const paginator = this.get(channelId);
                await paginator.onMessageReactionAdd(event);
            }
        };
        this.listeners[ClientEvents.MESSAGE_REACTION_REMOVE_ALL] = async (event) => {
            const { channelId, messageId } = event;
            if (this.has(channelId)) {
                const paginator = this.get(channelId);
                if (paginator.message && paginator.message.id === messageId) {
                    await paginator.stop(false);
                }
            }
        };
    }
}
exports.default = new PaginatorsStore();

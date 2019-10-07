"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { ClientEvents } = detritus_client_1.Constants;
const store_1 = require("./store");
// Stores rest-fetched guilds
class GuildMetadataStore extends store_1.Store {
    constructor() {
        super({ expire: (2 * 60) * 1000 });
    }
    insert(key, payload) {
        this.set(key, payload);
    }
    create() {
        this.listeners[ClientEvents.GUILD_DELETE] = async (event) => {
            const { guildId } = event;
            this.delete(guildId);
        };
    }
}
exports.default = new GuildMetadataStore();

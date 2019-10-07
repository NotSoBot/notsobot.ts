"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("./store");
class GuildMembersChunkStore extends store_1.Store {
    constructor() {
        super({ expire: (60) * 1000 });
    }
    insert(key, event) {
        this.set(key, event);
    }
}
exports.default = new GuildMembersChunkStore();

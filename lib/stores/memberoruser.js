"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("./store");
// Stores if we fetched a guild via the rest api or not
class MemberOrUserStore extends store_1.Store {
    constructor() {
        super({ expire: (2 * 60) * 1000 });
    }
    insert(key, payload) {
        this.set(key, payload);
    }
}
exports.default = new MemberOrUserStore();

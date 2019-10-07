"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
class Store extends detritus_client_1.Collections.BaseCollection {
    constructor() {
        super(...arguments);
        this.listeners = {};
    }
    connect(cluster) {
        this.create();
        for (let key in this.listeners) {
            if (this.listeners[key]) {
                cluster.addListener(key, this.listeners[key]);
            }
        }
    }
    create() {
    }
    stop(cluster) {
        for (let key in this.listeners) {
            if (this.listeners[key]) {
                cluster.removeListener(key, this.listeners[key]);
                this.listeners[key] = null;
            }
        }
        this.clear();
    }
}
exports.Store = Store;

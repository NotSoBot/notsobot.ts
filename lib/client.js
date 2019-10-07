"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
class NotSoClient extends detritus_client_1.CommandClient {
    constructor(options, token) {
        super(token || '', options);
        this.directoryIsAbsolute = false;
        if (options.directory) {
            this.directory = options.directory;
            this.directoryIsAbsolute = !!options.directoryIsAbsolute;
        }
    }
    async resetCommands() {
        this.clear();
        if (this.directory) {
            await this.addMultipleIn(this.directory, this.directoryIsAbsolute);
        }
    }
    async run(options = {}) {
        this.directory = options.directory || this.directory;
        if (options.directoryIsAbsolute !== undefined) {
            this.directoryIsAbsolute = !!options.directoryIsAbsolute;
        }
        if (this.directory) {
            await this.addMultipleIn(this.directory, this.directoryIsAbsolute);
        }
        return super.run(options);
    }
}
exports.NotSoClient = NotSoClient;

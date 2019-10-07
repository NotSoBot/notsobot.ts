"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'ping',
    metadata: {
        description: 'Ping Discord\'s Gateway and Rest api',
        examples: [
            'ping',
        ],
        type: constants_1.CommandTypes.UTILS,
        usage: 'ping',
    },
    ratelimits: [
        {
            duration: 5000,
            limit: 5,
            type: 'guild',
        },
        {
            duration: 1000,
            limit: 1,
            type: 'channel',
        },
    ],
    run: async (context) => {
        const { gateway, rest } = await context.client.ping();
        return context.editOrReply(`pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
    },
    onRunError: utils_1.onRunError,
};

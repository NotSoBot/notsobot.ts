"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./bootstrap");
const detritus_client_1 = require("detritus-client");
const client_1 = require("./client");
const guildchannels_1 = require("./stores/guildchannels");
const guildmetadata_1 = require("./stores/guildmetadata");
const paginators_1 = require("./stores/paginators");
const { ActivityTypes, PresenceStatuses } = detritus_client_1.Constants;
const bot = new client_1.NotSoClient({
    activateOnEdits: true,
    directory: './commands',
    gateway: {
        identifyProperties: {
            $browser: 'Discord iOS',
        },
        loadAllMembers: true,
        presence: {
            activity: {
                name: 'for .',
                type: ActivityTypes.WATCHING,
            },
            status: PresenceStatuses.ONLINE,
        },
    },
    mentionsEnabled: false,
    prefix: '..',
    ratelimits: [
        { duration: 60000, limit: 50, type: 'guild' },
        { duration: 5000, limit: 10, type: 'channel' },
    ],
});
bot.on('commandRatelimit', async ({ command, context, global, ratelimits }) => {
    if (context.message.canReply) {
        let replied = false;
        for (const { item, ratelimit, remaining } of ratelimits) {
            if (remaining < 1000 || replied || item.replied) {
                item.replied = true;
                continue;
            }
            replied = item.replied = true;
            let noun = 'You';
            switch (ratelimit.type) {
                case 'channel':
                case 'guild':
                    {
                        noun = 'Y\'all';
                    }
                    ;
                    break;
            }
            let content;
            if (global) {
                content = `${noun} are using commands WAY too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
            }
            else {
                content = `${noun} are using ${command.name} too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
            }
            try {
                const message = await context.reply(content);
                setTimeout(async () => {
                    item.replied = false;
                    try {
                        await message.delete();
                    }
                    catch (error) { }
                }, Math.max(remaining / 2, 1000));
            }
            catch (e) {
                item.replied = false;
            }
        }
    }
});
(async () => {
    const cluster = bot.client;
    process.title = `C: ${cluster.manager.clusterId}, S:(${cluster.shardStart}-${cluster.shardEnd})`;
    guildchannels_1.default.connect(cluster);
    guildmetadata_1.default.connect(cluster);
    paginators_1.default.connect(cluster);
    cluster.on('restResponse', ({ response, restRequest, shard }) => {
        const route = response.request.route;
        if (route) {
            if (response.ok) {
                console.log(`Shard #${shard.shardId}: (OK) ${response.statusCode} ${response.request.url} (${route.path})`);
            }
            else {
                console.log(`Shard #${shard.shardId}: (NOT OK) ${response.statusCode} ${response.request.url} (${route.path})`);
            }
            if ('x-ratelimit-bucket' in response.headers) {
                console.log(`${restRequest.bucketPath} - ${response.headers['x-ratelimit-bucket']} - ${restRequest.bucketKey}`);
            }
        }
    });
    cluster.on('shard', ({ shard }) => {
        const shardId = shard.shardId;
        console.log(`Loading up ${shardId}...`);
        shard.gateway.on('state', ({ state }) => {
            console.log(`Shard #${shardId} - ${state}`);
        });
        shard.gateway.on('close', ({ code, reason }) => {
            console.log(`Shard #${shardId} closed - ${code}, ${reason}`);
        });
        /*
        const now = Date.now();
        const send = <any> shard.gateway.send;
        shard.gateway.send = function () {
          console.log(Date.now() - now, 'SEND', ...arguments);
          return send.call(shard.gateway, ...arguments);
        };
        shard.gateway.on('packet', (packet) => {
          console.log(Date.now() - now, 'RECEIVED', packet.s, packet.op, packet.t);
        });
        */
    });
    try {
        await bot.run();
        console.log(`Shards #(${cluster.shards.map((shard) => shard.shardId).join(', ')}) loaded`);
    }
    catch (error) {
        console.log(error);
        console.log(error.errors);
    }
})();

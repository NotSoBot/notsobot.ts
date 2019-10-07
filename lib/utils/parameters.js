"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emoji_aware_1 = require("emoji-aware");
const detritus_client_1 = require("detritus-client");
const detritus_client_rest_1 = require("detritus-client-rest");
const detritus_utils_1 = require("detritus-utils");
const { DiscordAbortCodes, DiscordRegexNames } = detritus_client_1.Constants;
const guildchannels_1 = require("../stores/guildchannels");
const guildmetadata_1 = require("../stores/guildmetadata");
const memberoruser_1 = require("../stores/memberoruser");
const tools_1 = require("./tools");
async function applications(value, context) {
    value = value.trim().toLowerCase();
    if (value) {
        if (tools_1.isSnowflake(value) && context.applications.has(value)) {
            const application = context.applications.get(value);
            return [application];
        }
        return context.applications.filter((application) => {
            if (application.name.toLowerCase().includes(value)) {
                return true;
            }
            if (application.aliases) {
                return application.aliases.some((name) => {
                    return name.toLowerCase().includes(value);
                });
            }
            return false;
        });
    }
}
exports.applications = applications;
async function channel(value, context) {
    value = value.trim();
    if (value) {
        if (tools_1.isSnowflake(value)) {
            return context.channels.get(value);
        }
        return null;
    }
    return context.channel;
}
exports.channel = channel;
async function channelMetadata(value, context) {
    const channelId = value.trim() || context.channelId;
    const payload = { channels: null };
    if (!channelId) {
        return payload;
    }
    if (channelId === context.channelId) {
        payload.channel = context.channel;
    }
    else {
        payload.channel = null;
        if (tools_1.isSnowflake(channelId)) {
            if (context.channels.has(channelId)) {
                payload.channel = context.channels.get(channelId);
            }
            else {
                try {
                    payload.channel = await context.rest.fetchChannel(channelId);
                }
                catch (error) {
                }
            }
        }
        else {
            const guild = context.guild;
            if (guild) {
                const name = channelId.toLowerCase();
                payload.channel = guild.channels.find((channel) => channel.name.toLowerCase().includes(name)) || null;
            }
        }
    }
    if (payload.channel && payload.channel.isGuildChannel) {
        const guild = payload.channel.guild;
        if (guild) {
            payload.channels = guild.channels;
        }
        else {
            const guildId = payload.channel.guildId;
            if (guildchannels_1.default.has(guildId)) {
                payload.channels = guildchannels_1.default.get(guildId);
            }
            else {
                try {
                    payload.channels = await context.rest.fetchGuildChannels(guildId);
                }
                catch (error) {
                }
                guildchannels_1.default.set(guildId, payload.channels);
            }
        }
    }
    return payload;
}
exports.channelMetadata = channelMetadata;
async function guildMetadata(value, context) {
    const guildId = value.trim() || context.guildId;
    const payload = {
        channels: null,
        emojis: null,
        memberCount: 0,
        owner: null,
        presenceCount: 0,
        voiceStateCount: 0,
    };
    if (!guildId) {
        return payload;
    }
    if (guildmetadata_1.default.has(guildId)) {
        Object.assign(payload, guildmetadata_1.default.get(guildId));
        if (payload.guild) {
            if (guildchannels_1.default.has(guildId)) {
                payload.channels = guildchannels_1.default.get(guildId);
            }
            else {
                try {
                    payload.channels = await payload.guild.fetchChannels();
                }
                catch (error) {
                }
                guildchannels_1.default.set(guildId, payload.channels);
            }
        }
        return payload;
    }
    try {
        if (tools_1.isSnowflake(guildId)) {
            try {
                if (context.guilds.has(guildId)) {
                    payload.guild = context.guilds.get(guildId);
                    if (!payload.guild.hasMetadata) {
                        payload.guild = await context.rest.fetchGuild(guildId);
                    }
                    payload.channels = payload.guild.channels;
                    payload.memberCount = payload.guild.memberCount;
                    payload.presenceCount = payload.guild.presences.length;
                    payload.voiceStateCount = payload.guild.voiceStates.length;
                    guildchannels_1.default.set(guildId, payload.channels);
                }
                else {
                    payload.guild = await context.rest.fetchGuild(guildId);
                    if (guildchannels_1.default.has(guildId)) {
                        payload.channels = guildchannels_1.default.get(guildId);
                    }
                    else {
                        payload.channels = await payload.guild.fetchChannels();
                        guildchannels_1.default.set(guildId, payload.channels);
                    }
                    if (context.manager) {
                        const results = await context.manager.broadcastEval((cluster, gId) => {
                            for (let [shardId, shard] of cluster.shards) {
                                if (shard.guilds.has(gId)) {
                                    const guild = shard.guilds.get(gId);
                                    return {
                                        memberCount: guild.memberCount,
                                        presenceCount: guild.presences.length,
                                        voiceStateCount: guild.voiceStates.length,
                                    };
                                }
                            }
                        }, guildId);
                        const result = results.find((result) => result);
                        if (result) {
                            Object.assign(payload, result);
                        }
                    }
                }
                payload.emojis = payload.guild.emojis;
            }
            catch (error) {
            }
            if (payload.guild && payload.guild.ownerId) {
                payload.owner = payload.guild.owner;
                if (!payload.owner) {
                    payload.owner = await context.rest.fetchUser(payload.guild.ownerId);
                }
            }
            guildmetadata_1.default.set(guildId, payload);
        }
    }
    catch (error) {
        console.error(error);
        payload.guild = null;
    }
    return payload;
}
exports.guildMetadata = guildMetadata;
async function lastImageUrl(value, context) {
    value = value.trim();
    if (!value) {
        {
            const url = tools_1.findImageUrlInMessages([context.message]);
            if (url) {
                return url;
            }
        }
        const channel = context.channel;
        if (channel) {
            {
                const url = tools_1.findImageUrlInMessages(channel.messages.toArray().reverse());
                if (url) {
                    return url;
                }
            }
            {
                const messages = await channel.fetchMessages({ limit: 100 });
                const url = tools_1.findImageUrlInMessages(messages);
                if (url) {
                    return url;
                }
            }
        }
        return undefined;
    }
    {
        const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.TEXT_URL, value);
        if (matches.length) {
            const { text } = matches[0];
            if (!context.message.embeds.length) {
                await detritus_utils_1.Timers.sleep(1000);
            }
            const url = tools_1.findImageUrlInMessages([context.message]);
            return url || text;
        }
    }
    const text = value;
    try {
        if (!text.includes('#')) {
            {
                const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.MENTION_USER, text);
                if (matches.length) {
                    const { id: userId } = matches[0];
                    if (tools_1.isSnowflake(userId)) {
                        let user;
                        if (context.message.mentions.has(userId)) {
                            user = context.message.mentions.get(userId);
                        }
                        else {
                            user = await context.rest.fetchUser(userId);
                        }
                        return user.avatarUrlFormat(null, { size: 1024 });
                    }
                }
            }
            if (tools_1.isSnowflake(text)) {
                const userId = text;
                let user;
                if (context.message.mentions.has(userId)) {
                    user = context.message.mentions.get(userId);
                }
                else {
                    user = await context.rest.fetchUser(userId);
                }
                return user.avatarUrlFormat(null, { size: 1024 });
            }
            {
                const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.EMOJI, text);
                if (matches.length) {
                    const { animated, id } = matches[0];
                    const format = (animated) ? 'gif' : 'png';
                    return detritus_client_rest_1.Endpoints.CDN.URL + detritus_client_rest_1.Endpoints.CDN.EMOJI(id, format);
                }
            }
            {
                const emojis = emoji_aware_1.onlyEmoji(text);
                if (emojis && emojis.length) {
                    for (let emoji of emojis) {
                        const codepoint = tools_1.toCodePoint(emoji);
                        return `https://cdn.notsobot.com/twemoji/512x512/${codepoint}.png`;
                    }
                }
            }
        }
        {
            // guild member chunk or search cache
            const parts = text.split('#');
            const username = parts.shift().toLowerCase().slice(0, 32);
            let discriminator = null;
            if (parts.length) {
                discriminator = parts.shift().padStart(4, '0');
            }
            const found = await tools_1.findMemberByChunk(context, username, discriminator);
            if (found) {
                return found.avatarUrlFormat(null, { size: 1024 });
            }
        }
    }
    catch (error) {
    }
    return null;
}
exports.lastImageUrl = lastImageUrl;
async function lastImageUrls(value, context) {
    value = value.trim();
    if (!value) {
        {
            const url = tools_1.findImageUrlInMessages([context.message]);
            if (url) {
                return [url];
            }
        }
        const channel = context.channel;
        if (channel) {
            {
                const url = tools_1.findImageUrlInMessages(channel.messages.toArray().reverse());
                if (url) {
                    return [url];
                }
            }
            {
                const messages = await channel.fetchMessages({ limit: 100 });
                const url = tools_1.findImageUrlInMessages(messages);
                if (url) {
                    return [url];
                }
            }
        }
        return null;
    }
    {
        const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.TEXT_URL, value);
        if (matches.length) {
            const { text } = matches[0];
            if (!context.message.embeds.length) {
                await detritus_utils_1.Timers.sleep(1000);
            }
            const url = tools_1.findImageUrlInMessages([context.message]);
            return [url || text];
        }
    }
    const urls = new Set();
    const values = Array.from(new Set(value.split(' ')));
    for (let i = 0; i < Math.min(5, values.length); i++) {
        if (3 <= urls.size) {
            break;
        }
        const text = values[i];
        try {
            if (!text.includes('#')) {
                {
                    const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.MENTION_USER, text);
                    if (matches.length) {
                        const { id: userId } = matches[0];
                        if (tools_1.isSnowflake(userId)) {
                            let user;
                            if (context.message.mentions.has(userId)) {
                                user = context.message.mentions.get(userId);
                            }
                            else {
                                user = await context.rest.fetchUser(userId);
                            }
                            urls.add(user.avatarUrlFormat(null, { size: 1024 }));
                            continue;
                        }
                    }
                }
                if (tools_1.isSnowflake(text)) {
                    const userId = text;
                    let user;
                    if (context.message.mentions.has(userId)) {
                        user = context.message.mentions.get(userId);
                    }
                    else {
                        user = await context.rest.fetchUser(userId);
                    }
                    urls.add(user.avatarUrlFormat(null, { size: 1024 }));
                    continue;
                }
                {
                    const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.EMOJI, text);
                    if (matches.length) {
                        const { animated, id } = matches[0];
                        const format = (animated) ? 'gif' : 'png';
                        urls.add(detritus_client_rest_1.Endpoints.CDN.URL + detritus_client_rest_1.Endpoints.CDN.EMOJI(id, format));
                        continue;
                    }
                }
                {
                    const emojis = emoji_aware_1.onlyEmoji(text);
                    if (emojis && emojis.length) {
                        for (let emoji of emojis) {
                            const codepoint = tools_1.toCodePoint(emoji);
                            urls.add(`https://cdn.notsobot.com/twemoji/512x512/${codepoint}.png`);
                        }
                        continue;
                    }
                }
            }
            {
                // guild member chunk or search cache
                const parts = text.split('#');
                const username = parts.shift().toLowerCase().slice(0, 32);
                let discriminator = null;
                if (parts.length) {
                    discriminator = parts.shift().padStart(4, '0');
                }
                const found = await tools_1.findMemberByChunk(context, username, discriminator);
                if (found) {
                    urls.add(found.avatarUrlFormat(null, { size: 1024 }));
                    continue;
                }
            }
        }
        catch (error) {
        }
    }
    return Array.from(urls).slice(0, 3);
}
exports.lastImageUrls = lastImageUrls;
async function memberOrUser(value, context) {
    if (!value) {
        return context.member || context.user;
    }
    try {
        {
            const { matches } = detritus_client_1.Utils.regex(DiscordRegexNames.MENTION_USER, value);
            if (matches.length) {
                const { id: userId } = matches[0];
                if (tools_1.isSnowflake(userId)) {
                    if (context.message.mentions.has(userId)) {
                        return context.message.mentions.get(userId);
                    }
                    else {
                        return await context.rest.fetchUser(userId);
                    }
                }
            }
        }
        if (tools_1.isSnowflake(value)) {
            const userId = value;
            const key = `${context.guildId}.${userId}`;
            if (memberoruser_1.default.has(key)) {
                return memberoruser_1.default.get(key);
            }
            let user;
            if (context.guildId) {
                try {
                    if (context.members.has(context.guildId, userId)) {
                        user = context.members.get(context.guildId, userId);
                        if (user.isPartial) {
                            user = await context.rest.fetchGuildMember(context.guildId, userId);
                        }
                    }
                    else {
                        user = await context.rest.fetchGuildMember(context.guildId, userId);
                    }
                }
                catch (error) {
                    // UNKNOWN_MEMBER == userId exists
                    // UNKNOWN_USER == userId doesn't exist
                    if (error.code !== DiscordAbortCodes.UNKNOWN_MEMBER) {
                        user = null;
                    }
                }
            }
            if (user === undefined) {
                if (context.users.has(userId)) {
                    user = context.users.get(userId);
                }
                else {
                    user = await context.rest.fetchUser(userId);
                }
            }
            memberoruser_1.default.set(key, user);
            return user;
        }
        // guild member chunk or search cache
        const nameParts = value.split('#');
        const username = nameParts.shift().toLowerCase().slice(0, 32);
        let discriminator = null;
        if (nameParts.length) {
            discriminator = nameParts.shift().padStart(4, '0');
        }
        const found = await tools_1.findMemberByChunk(context, username, discriminator);
        if (found) {
            return found;
        }
    }
    catch (error) {
        console.error(error);
    }
    return null;
}
exports.memberOrUser = memberOrUser;
function percentage(value, context) {
    value = value.trim().replace(/%/g, '');
    const percentage = parseFloat(value);
    if (isNaN(percentage)) {
        return percentage;
    }
    return Math.max(0, Math.min(percentage / 100));
}
exports.percentage = percentage;

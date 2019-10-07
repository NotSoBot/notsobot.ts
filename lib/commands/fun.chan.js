"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name: 'chan',
    aliases: ['4chan', 'board', 'b'],
    ratelimit: {
        duration: 5000,
        limit: 5,
        type: 'guild',
    },
    args: [
        { name: '' },
    ],
    metadata: {
        examples: [
            'chan g',
            'chan g 13371337'
        ]
    },
    type: constants_1.CommandTypes.FUN,
    run: async (context) => {
    },
};
const detritus_client_1 = require("detritus-client");
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'resize',
    aliases: ['enlarge', 'rescale'],
    args: [
        { name: 'convert' },
        { default: 2, name: 'scale', type: 'float' },
        { name: 'size' },
    ],
    label: 'url',
    metadata: {
        examples: [
            'resize',
            'resize cake',
            'resize <@439205512425504771> -convert jpeg',
            'resize 👌🏿 -scale 2',
            'resize https://cdn.notsobot.com/brands/notsobot.png -convert webp -size 2048',
        ],
        type: constants_1.CommandTypes.IMAGE,
        usage: 'resize ?<emoji|id|mention|name|url> (-convert <format>) (-scale <number>) (-size <number>)',
    },
    type: utils_1.Parameters.lastImageUrl,
    onBefore: (context) => {
        const channel = context.channel;
        return (channel) ? channel.canAttachFiles : false;
    },
    onCancel: (context) => context.reply('⚠ Unable to send files in this channel.'),
    onBeforeRun: (context, args) => !!args.url,
    onCancelRun: (context, args) => {
        if (args.url === undefined) {
            return context.editOrReply('⚠ Unable to find any messages with an image.');
        }
        else {
            return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
        }
    },
    run: async (context, args) => {
        await context.triggerTyping();
        const resize = await api_1.imageResize(context, {
            convert: args.convert,
            scale: args.scale,
            size: args.size,
            url: args.url,
        });
        const { 'content-length': size, 'content-type': contentType, 'x-dimensions-height': height, 'x-dimensions-width': width, 'x-extension': extension, 'x-frames-new': newFrames, 'x-frames-old': oldFrames, } = resize.headers;
        const filename = `resized.${extension}`;
        const embed = new detritus_client_1.Utils.Embed();
        embed.setColor(constants_1.EmbedColors.DEFAULT);
        embed.setImage(`attachment://${filename}`);
        let footer = `${width}x${height}`;
        if (contentType === 'image/gif') {
            footer = `${footer}, ${newFrames} frames`;
        }
        embed.setFooter(`${footer}, ${utils_1.formatMemory(parseInt(size), 2)}`);
        return context.reply({ embed, file: { contentType, filename, data: resize.data } });
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const constants_1 = require("../constants");
exports.default = {
    name: 'eval',
    args: [
        { default: 2, name: 'jsonspacing', type: Number },
        { name: 'noembed', type: Boolean },
        { name: 'noreply', type: Boolean },
        { name: 'files.gg', label: 'upload', type: Boolean },
    ],
    label: 'code',
    metadata: {
        description: 'Eval some code',
        examples: [
            'eval context.client.token',
        ],
        type: constants_1.CommandTypes.OWNER,
        usage: 'eval <code> (-jsonspacing <number>) (-noembed) (-noreply) (-files.gg)',
    },
    type: (value) => {
        const { matches } = detritus_client_1.Utils.regex(detritus_client_1.Constants.DiscordRegexNames.TEXT_CODEBLOCK, value);
        if (matches.length) {
            return matches[0].text;
        }
        return value;
    },
    responseOptional: true,
    onBefore: (context) => context.user.isClientOwner,
    run: async (context, args) => {
        const { code } = args;
        let language = 'js';
        let message;
        let errored = false;
        try {
            message = await Promise.resolve(eval(code));
            if (typeof (message) === 'object') {
                message = JSON.stringify(message, null, args.jsonspacing);
                language = 'json';
            }
        }
        catch (error) {
            message = (error) ? error.stack || error.message : error;
            errored = true;
        }
        if (!args.noreply) {
            let content;
            if (args.upload) {
                try {
                    const upload = await context.rest.request({
                        files: [{ filename: `eval.${language}`, data: message, name: 'file' }],
                        method: 'post',
                        url: 'https://api.files.gg/files',
                    });
                    return context.editOrReply(upload.urls.main);
                }
                catch (error) {
                    content = error.stack || error.message;
                    language = 'js';
                    errored = true;
                }
            }
            else {
                content = String(message);
            }
            if (!args.noembed) {
                const channel = context.channel;
                if (channel && channel.canEmbedLinks) {
                    const embed = new detritus_client_1.Utils.Embed();
                    if (errored) {
                        embed.setColor(constants_1.EmbedColors.ERROR);
                    }
                    else {
                        embed.setColor(constants_1.EmbedColors.DEFAULT);
                    }
                    embed.setDescription(Markup.codeblock(content, { language, mentions: false }));
                    embed.setFooter('Eval', constants_1.EmbedBrands.NOTSOBOT);
                    return context.editOrReply({ embed });
                }
            }
            return context.editOrReply(Markup.codeblock(content, { language }));
        }
    },
    onError: (context, args, error) => console.error(error),
};

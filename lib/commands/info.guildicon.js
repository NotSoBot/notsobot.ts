"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Colors } = detritus_client_1.Constants;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'guildicon',
    label: 'payload',
    metadata: {
        description: 'Get the icon for a guild, defaults to the current guild',
        examples: [
            'guildicon',
            'guildicon 178313653177548800',
        ],
        type: constants_1.CommandTypes.INFO,
        usage: 'guildicon ?<id>',
    },
    ratelimit: {
        duration: 5000,
        limit: 5,
        type: 'guild',
    },
    type: utils_1.Parameters.guildMetadata,
    onBeforeRun: (context, args) => !!args.payload.guild,
    onCancelRun: (context) => context.editOrReply('⚠ Unable to find that guild.'),
    run: async (context, args) => {
        const { guild } = args.payload;
        if (guild.icon) {
            const url = guild.iconUrlFormat(null, { size: 512 });
            const channel = context.channel;
            if (channel && channel.canEmbedLinks) {
                const embed = new detritus_client_1.Utils.Embed();
                embed.setAuthor(guild.name, url, guild.jumpLink);
                embed.setColor(Colors.BLURPLE);
                embed.setDescription(`[**Icon Url**](${guild.iconUrl})`);
                embed.setImage(url);
                return context.editOrReply({ embed });
            }
            return context.editOrReply(url);
        }
        return context.editOrReply('Guild doesn\'t have an icon.');
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};

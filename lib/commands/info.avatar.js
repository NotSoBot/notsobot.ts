"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'avatar',
    label: 'user',
    metadata: {
        description: 'Get the avatar for a user, defaults to self',
        examples: [
            'user',
            'user notsobot',
        ],
        type: constants_1.CommandTypes.INFO,
        usage: 'user ?<id|mention|name>',
    },
    ratelimit: {
        duration: 5000,
        limit: 5,
        type: 'guild',
    },
    type: utils_1.Parameters.memberOrUser,
    onBeforeRun: (context, args) => !!args.user,
    onCancelRun: (context) => context.editOrReply('⚠ Unable to find that guy.'),
    run: async (context, args) => {
        const { user } = args;
        const channel = context.channel;
        if (channel && channel.canEmbedLinks) {
            const embed = new detritus_client_1.Utils.Embed();
            embed.setAuthor(user.toString(), user.avatarUrlFormat(null, { size: 512 }), user.jumpLink);
            embed.setColor(constants_1.PresenceStatusColors['offline']);
            embed.setDescription(`[**Avatar Url**](${user.avatarUrl})`);
            embed.setImage(user.avatarUrlFormat(null, { size: 512 }));
            const presence = user.presence;
            if (presence && presence.status in constants_1.PresenceStatusColors) {
                embed.setColor(constants_1.PresenceStatusColors[presence.status]);
            }
            return context.editOrReply({ embed });
        }
        return context.editOrReply(user.avatarUrl);
    },
    onRunError: (context, args, error) => {
        return context.editOrReply(`⚠ Error: ${error.message}`);
    },
};

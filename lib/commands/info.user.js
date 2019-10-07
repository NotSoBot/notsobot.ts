"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'user',
    aliases: ['userinfo', 'member', 'memberinfo'],
    label: 'user',
    metadata: {
        description: 'Get information about a user, defaults to self',
        examples: [
            'user',
            'user cake',
            'user cake#1',
            'user <@439205512425504771>',
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
    onBefore: (context) => {
        const channel = context.channel;
        return (channel) ? channel.canEmbedLinks : false;
    },
    onCancel: (context) => context.editOrReply('⚠ Unable to embed information in this channel.'),
    onBeforeRun: (context, args) => !!args.user,
    onCancelRun: (context) => context.editOrReply('⚠ Unable to find that guy.'),
    run: async (context, args) => {
        const isMember = (args.user instanceof detritus_client_1.Structures.Member);
        const member = args.user;
        const user = args.user;
        const presence = user.presence;
        let activities;
        if (presence) {
            activities = presence.activities.sort((x, y) => {
                return x.position - y.position;
            });
        }
        else {
            activities = [];
        }
        const pageLimit = activities.length || 1;
        const paginator = new utils_1.Paginator(context, {
            pageLimit,
            onPage: (page) => {
                const embed = new detritus_client_1.Utils.Embed();
                embed.setAuthor(user.toString(), user.avatarUrlFormat(null, { size: 1024 }), user.jumpLink);
                embed.setColor(constants_1.PresenceStatusColors['offline']);
                embed.setDescription(member.mention);
                embed.setThumbnail(user.avatarUrlFormat(null, { size: 1024 }));
                {
                    const description = [];
                    description.push(`**Id**: \`${user.id}\``);
                    description.push(`**Bot**: ${(user.bot) ? 'Yes' : 'No'}`);
                    embed.addField('Information', description.join('\n'), true);
                }
                {
                    const description = [];
                    description.push(`**Discord**: ${user.createdAt.toLocaleString('en-US', constants_1.DateOptions)}`);
                    if (isMember && member.joinedAt) {
                        description.push(`**Guild**: ${member.joinedAt.toLocaleString('en-US', constants_1.DateOptions)}`);
                    }
                    embed.addField('Joined', description.join('\n'), true);
                }
                if (isMember) {
                    const description = [];
                    if (member.premiumSince) {
                        description.push(`**Boosting Since**: ${member.premiumSince.toLocaleString('en-US', constants_1.DateOptions)}`);
                    }
                    if (member.nick) {
                        description.push(`**Nickname**: ${member.nick}`);
                    }
                    if (member.isOwner) {
                        description.push('**Owner**: Yes');
                    }
                    const roles = member.roles
                        .map((role, roleId) => role || roleId)
                        .sort((x, y) => {
                        if (x instanceof detritus_client_1.Structures.Role && y instanceof detritus_client_1.Structures.Role) {
                            return x.position - y.position;
                        }
                        return 0;
                    })
                        .map((role) => {
                        if (role instanceof detritus_client_1.Structures.Role) {
                            if ((role.isDefault || context.guildId !== member.guildId) && role) {
                                return `\`${role.name}\``;
                            }
                            return role.mention;
                        }
                        return `<@&${role}>`;
                    });
                    let rolesText = `**Roles (${roles.length})**: ${roles.join(', ')}`;
                    if (800 < rolesText.length) {
                        const fromIndex = rolesText.length - ((rolesText.length - 800) + 3);
                        const index = rolesText.lastIndexOf(',', fromIndex);
                        rolesText = rolesText.slice(0, index) + '...';
                    }
                    description.push(rolesText);
                    const voiceChannel = member.voiceChannel;
                    if (voiceChannel) {
                        description.push(`**Voice**: ${voiceChannel.toString()}`);
                    }
                    embed.addField('Guild Specific', description.join('\n'));
                }
                if (presence) {
                    if (presence.status in constants_1.PresenceStatusColors) {
                        embed.setColor(constants_1.PresenceStatusColors[presence.status]);
                    }
                    if (presence.clientStatus) {
                        const description = [];
                        for (let key of constants_1.PRESENCE_CLIENT_STATUS_KEYS) {
                            let status = presence.clientStatus[key];
                            if (status) {
                                if (status in constants_1.PresenceStatusTexts) {
                                    status = constants_1.PresenceStatusTexts[status];
                                }
                                description.push(`**${utils_1.toTitleCase(key)}**: ${status}`);
                            }
                        }
                        embed.addField('Status', description.join('\n'));
                    }
                    else {
                        let status = presence.status;
                        if (status in constants_1.PresenceStatusTexts) {
                            status = constants_1.PresenceStatusTexts[status];
                        }
                        embed.addField('Status', status, true);
                    }
                    const activityId = page - 1;
                    if (activityId in activities) {
                        const activity = activities[activityId];
                        const description = [];
                        if (activity.isCustomStatus) {
                            description.push(`Custom Status: ${Markup.escape.all(activity.state || '')}`);
                            if (activity.details) {
                                try {
                                    const details = new url_1.URLSearchParams(activity.details);
                                    const channelId = details.get('c') || '';
                                    if (context.channels.has(channelId)) {
                                        const channel = context.channels.get(channelId);
                                        if (channel.isGuildVoice) {
                                            description.push(`In Voice: ${channel.mention} (${channel.id})`);
                                        }
                                    }
                                }
                                catch (error) {
                                }
                            }
                        }
                        else {
                            const text = [activity.typeText, Markup.escape.all(activity.name || '')];
                            description.push(text.filter((v) => v).join(' '));
                            if (activity.isOnSpotify) {
                                if (activity.assets && activity.assets.largeText) {
                                    description.push(`**Album**: ${activity.assets.largeText}`);
                                }
                                if (activity.details) {
                                    description.push(`**Song**: ${activity.details}`);
                                }
                                if (activity.state) {
                                    description.push(`**Artists**: ${activity.state.split('; ').join(', ')}`);
                                }
                            }
                            else {
                                if (activity.details) {
                                    description.push(`**Details**: ${Markup.escape.all(activity.details)}`);
                                }
                                if (activity.state) {
                                    description.push(`**State**: ${Markup.escape.all(activity.state)}`);
                                }
                            }
                            if (activity.isOnXbox) {
                                description.push('**On Xbox**');
                            }
                        }
                        let name = 'Activity';
                        if (1 < pageLimit) {
                            name = `Activity (${page} of ${pageLimit})`;
                        }
                        embed.addField(name, description.join('\n'), true);
                    }
                }
                else {
                    embed.addField('Activity', constants_1.PresenceStatusTexts['offline']);
                }
                return embed;
            },
        });
        return await paginator.start();
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};

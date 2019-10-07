"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Permissions } = detritus_client_1.Constants;
const { PermissionTools } = detritus_client_1.Utils;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'role',
    args: [
        {
            default: (context) => context.channelId,
            name: 'channel',
            type: (value, context) => context.guild && context.guild.channels.get(value),
        },
    ],
    disableDm: true,
    metadata: {
        description: 'Get information for a role, defaults to the @everyone role',
        examples: [
            'role',
            'role everyone',
        ],
        type: constants_1.CommandTypes.INFO,
        usage: 'role ?<id|mention|name> (-channel <id>)',
    },
    ratelimit: {
        duration: 5000,
        limit: 5,
        type: 'guild',
    },
    type: (value, context) => {
        value = value.trim();
        const guild = context.guild;
        let role;
        if (guild) {
            if (value) {
                if (utils_1.isSnowflake(value)) {
                    role = guild.roles.get(value);
                }
                else {
                    const name = value.toLowerCase();
                    role = guild.roles.find((role) => {
                        return role.name.toLowerCase().includes(name);
                    });
                }
            }
            else {
                role = guild.defaultRole;
            }
        }
        return role || null;
    },
    onBeforeRun: (context, args) => !!args.channel && !!args.role,
    onCancelRun: (context, args) => {
        if (!args.channel) {
            return context.editOrReply('Unknown Channel');
        }
        else if (!args.role) {
            return context.editOrReply('Unknown Role');
        }
    },
    run: async (context, args) => {
        args = args;
        const { channel, role } = args;
        const embed = new detritus_client_1.Utils.Embed();
        embed.setAuthor(role.name);
        embed.setDescription(`Showing channel permissions for ${role.mention} in ${channel.mention}`);
        if (role.color) {
            embed.setColor(role.color);
        }
        {
            const description = [];
            description.push(`**Created**: ${role.createdAt.toLocaleString('en-US', constants_1.DateOptions)}`);
            description.push(`**Default Role**: ${(role.isDefault) ? 'Yes' : 'No'}`);
            embed.addField('Information', description.join('\n'), true);
        }
        {
            const description = [];
            description.push(`**Members**: ${role.members.length.toLocaleString()}`);
            embed.addField('Counts', description.join('\n'), true);
        }
        {
            const rows = [];
            for (const key of constants_1.PERMISSIONS_KEYS_ADMIN) {
                const can = PermissionTools.checkPermissions(role.permissions, Permissions[key]);
                rows.push([`${constants_1.PermissionsText[key]}:`, `${(can) ? constants_1.BooleanEmojis.YES : constants_1.BooleanEmojis.NO}`]);
            }
            embed.addField('Moderation', [
                '```css',
                utils_1.padCodeBlockFromRows(rows).join('\n'),
                '```',
            ].join('\n'), true);
        }
        if (channel) {
            const permissions = role.permissionsIn(channel);
            if (channel.isText) {
                const rows = [];
                for (const key of constants_1.PERMISSIONS_KEYS_TEXT) {
                    const can = PermissionTools.checkPermissions(permissions, Permissions[key]);
                    rows.push([`${constants_1.PermissionsText[key]}:`, `${(can) ? constants_1.BooleanEmojis.YES : constants_1.BooleanEmojis.NO}`]);
                }
                embed.addField('Text', [
                    '```css',
                    utils_1.padCodeBlockFromRows(rows).join('\n'),
                    '```',
                ].join('\n'), true);
            }
            else if (channel.isVoice) {
                const rows = [];
                for (const key of constants_1.PERMISSIONS_KEYS_VOICE) {
                    const can = PermissionTools.checkPermissions(permissions, Permissions[key]);
                    rows.push([`${constants_1.PermissionsText[key]}:`, `${(can) ? constants_1.BooleanEmojis.YES : constants_1.BooleanEmojis.NO}`]);
                }
                embed.addField('Voice', [
                    '```css',
                    utils_1.padCodeBlockFromRows(rows).join('\n'),
                    '```',
                ].join('\n'), true);
            }
            return context.editOrReply({ content: '', embed });
        }
    },
    onRunError: (context, args, error) => {
        console.log(error);
    },
};

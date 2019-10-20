import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import {
  createGuildPrefix,
  deleteGuildPrefix,
  editGuildSettings,
  fetchGuildSettings,
} from '../../api';
import {
  CommandTypes,
  EmbedBrands,
  EmbedColors,
} from '../../constants';
import { Parameters, onRunError, onTypeError } from '../../utils';

import GuildSettingsStore, { GuildSettingsStored } from '../../stores/guildsettings';


export default (<Command.CommandOptions> {
  name: 'prefix',
  aliases: ['prefixes', 'setprefix'],
  args: [
    {name: 'clear', type: Boolean},
    {name: 'delete', type: Boolean},
    {name: 'replace', type: Boolean},
  ],
  disableDm: true,
  metadata: {
    description: 'Set the prefix for this bot on a guild (Bot Mentions will always override this)',
    examples: [
      'prefix ..',
      'prefix -clear',
      'prefix .. -delete',
      'prefix .. -replace',
    ],
    type: CommandTypes.SETTINGS,
    usage: 'prefix <prefix> (-clear) (-delete) (-replace)',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  type: Parameters.string({maxLength: 128}),
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed in this channel.'),
  run: async (context, args) => {
    const guildId = <string> context.guildId;

    const embed = new Utils.Embed();
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);

    let settings: GuildSettingsStored | null = null;
    if ((args.clear || args.prefix) && context.member && (context.member.isClientOwner || context.member.canManageGuild)) {
      if (args.clear) {
        embed.setTitle('Cleared prefixes');
        settings = <GuildSettingsStored> await editGuildSettings(context, guildId, {prefixes: []});
      } else if (args.delete) {
        embed.setTitle(`Deleted prefix: **${Markup.escape.all(args.prefix)}**`);
        settings = <GuildSettingsStored> await deleteGuildPrefix(context, guildId, args.prefix);
      } else if (args.replace) {
        embed.setTitle(`Replaced prefixes with **${Markup.escape.all(args.prefix)}**`);
        settings = <GuildSettingsStored> await editGuildSettings(context, guildId, {prefixes: [args.prefix]});
      } else {
        embed.setTitle(`Created prefix: **${Markup.escape.all(args.prefix)}**`);
        settings = <GuildSettingsStored> await createGuildPrefix(context, guildId, args.prefix);
      }
    } else {
      embed.setTitle('Showing prefixes');
      if (GuildSettingsStore.has(guildId)) {
        settings = <GuildSettingsStored> GuildSettingsStore.get(guildId);
      } else {
        settings = <GuildSettingsStored> await fetchGuildSettings(context, guildId);
      }
    }

    if (settings) {
      GuildSettingsStore.set(guildId, settings);
      if (settings.prefixes.length) {
        const description = settings.prefixes.map((prefix, i) => {
          return `${i + 1}. **${Markup.escape.all(prefix.prefix)}** added on ${prefix.added}`;
        });
        embed.setDescription(description.join('\n'));
      } else {
        const description = Array.from(context.commandClient.prefixes.custom).map((prefix, i) => {
          return `${i + 1}. **${Markup.escape.all(prefix)}**`;
        });

        embed.setDescription([
          'Using the default prefixes:\n',
          description.join('\n'),
        ].join('\n'));
      }
    }

    return context.editOrReply({embed});
  },
  onRunError,
  onTypeError,
});

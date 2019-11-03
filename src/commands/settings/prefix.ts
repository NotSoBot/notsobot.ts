import * as moment from 'moment';

import { Command, CommandClient, Constants, Utils } from 'detritus-client';
const { Permissions } = Constants;
const { Embed, Markup } = Utils;

import { createGuildPrefix, deleteGuildPrefix, editGuildSettings, fetchGuildSettings } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import GuildSettingsStore, { GuildSettingsStored } from '../../stores/guildsettings';
import { RestResponses } from '../../types';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  clear: boolean,
  delete: boolean,
  prefix: string,
  replace: boolean,
}

export default class PrefixCommand extends BaseCommand {
  aliases = ['prefixes', 'setprefix'];
  name = 'prefix';

  disableDm = true;
  metadata = {
    description: 'Set the prefix for this bot on a guild (Bot Mentions will always override this)',
    examples: [
      'prefix ..',
      'prefix -clear',
      'prefix .. -delete',
      'prefix .. -replace',
    ],
    type: CommandTypes.SETTINGS,
    usage: 'prefix <prefix> (-clear) (-delete) (-replace)',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  type = Parameters.string({maxLength: 128});

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {name: 'clear', type: Boolean},
        {name: 'delete', aliases: ['remove'], type: Boolean},
        {name: 'replace', aliases: ['set'], type: Boolean},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = <string> context.guildId;

    const embed = new Embed();
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);

    let settings: GuildSettingsStored | null = null;
    if ((args.clear || args.prefix) && context.member && (context.member.isClientOwner || context.member.canManageGuild)) {
      if (args.clear) {
        embed.setTitle('Cleared prefixes');
        settings = await editGuildSettings(context, guildId, {prefixes: []});
        GuildSettingsStore.set(guildId, settings);
      } else if (args.replace) {
        embed.setTitle(`Replaced prefixes with **${Markup.escape.all(args.prefix)}**`);
        settings = await editGuildSettings(context, guildId, {prefixes: [args.prefix]});
        GuildSettingsStore.set(guildId, settings);
      } else {
        let prefixes: Array<RestResponses.GuildPrefix>;
        if (args.delete) {
          embed.setTitle(`Deleted prefix: **${Markup.escape.all(args.prefix)}**`);
          prefixes = await deleteGuildPrefix(context, guildId, args.prefix);
        } else {
          embed.setTitle(`Created prefix: **${Markup.escape.all(args.prefix)}**`);
          prefixes = await createGuildPrefix(context, guildId, args.prefix);
        }
        if (GuildSettingsStore.has(guildId)) {
          settings = <GuildSettingsStored> GuildSettingsStore.get(guildId);
          settings.prefixes = prefixes;
        }
      }
    } else {
      embed.setTitle('Showing prefixes');
      if (GuildSettingsStore.has(guildId)) {
        settings = <GuildSettingsStored> GuildSettingsStore.get(guildId);
      } else {
        settings = await fetchGuildSettings(context, guildId);
        GuildSettingsStore.set(guildId, settings);
      }
    }

    if (settings) {
      if (settings.prefixes.length) {
        const description = settings.prefixes.map((prefix, i) => {
          const added = moment(prefix.added).fromNow();
          return `${i + 1}. **${Markup.escape.all(prefix.prefix)}** added ${added}`;
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
  }
}

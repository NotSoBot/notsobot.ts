import moment from 'moment';

import { Collections, Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsCommandsBlocklist } from '../../../api/structures/guildsettings';
import { getTranslator } from '../../i18n';
import { CommandCategories, EmbedColors, GuildCommandsBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Paginator, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'commands.blocklist';

export interface CommandArgs {
  only: GuildCommandsBlocklistTypes | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guildId = context.guildId!;

  const { commandsBlocklist } = (await GuildSettingsStore.getOrFetch(context, guildId))!;
  return createCommandsBlocklistsEmbed(context, commandsBlocklist, {only: args.only});
}


const ELEMENTS_PER_PAGE = 10;

export async function createCommandsBlocklistsEmbed(
  context: Command.Context | Interaction.InteractionContext,
  commandsBlocklist: Collections.BaseCollection<string, GuildSettingsCommandsBlocklist>,
  options: {only?: GuildCommandsBlocklistTypes | null, title?: string} = {},
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  let sorted = commandsBlocklist.toArray();
  if (options.only) {
    sorted = sorted.filter((blocked) => blocked.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });

  const pages = chunkArray<GuildSettingsCommandsBlocklist>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || translate('moderation_commands_blocklist.commands_blocked');
  let footer = translate('moderation_commands_blocklist.command_blocklist');
  if (options.only) {
    footer = translate('moderation_commands_blocklist.only_s', {footer: footer, types: translateMaybe(`moderation.types.${options.only}`, `${toTitleCase(options.only)}s`)});
  }
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        embed.setTitle(title);
        embed.setFooter((pageLimit === 1) ? footer : translate('moderation_commands_blocklist.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber}));

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((blocked, i) => {
            let type = translate('moderation_commands_blocklist.unknown', {type: blocked.type});
            switch (blocked.type) {
              case GuildCommandsBlocklistTypes.CHANNEL: {
                type = translate('moderation_commands_blocklist.channel_blocked', {blocked: blocked.id});
              }; break;
              case GuildCommandsBlocklistTypes.GUILD: {
                type = translate('moderation_commands_blocklist.guild_blocked');
              }; break;
              case GuildCommandsBlocklistTypes.ROLE: {
                type = translate('moderation_commands_blocklist.role_blocked', {blocked: blocked.id});
              }; break;
              case GuildCommandsBlocklistTypes.USER: {
                type = translate('moderation_commands_blocklist.user_blocked', {blocked: blocked.id});
              }; break;
            }
            return [
              translate('moderation_commands_blocklist.added', {addedAtText: moment(blocked.added).locale(language).fromNow(), command: blocked.command, index: (i * pageNumber) + 1}),
              `-> ${type}`,
              translate('moderation_commands_blocklist.by', {userId: blocked.userId}),
            ].join('\n');
          });
          embed.setDescription(description.join('\n'));
        }
        return embed;
      },
    });
    return await paginator.start();
  }
  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);

  embed.setTitle(title);
  if (options.only) {
    embed.setDescription(translate('moderation_commands_blocklist.currently_no_commands_are_blocked_for_any', {types: translateMaybe(`moderation.types.${options.only}`, `${toTitleCase(options.only)}s`).toLowerCase()}));
  } else {
    embed.setDescription(translate('moderation_commands_blocklist.currently_no_commands_are_blocked_in_this'));
  }
  embed.setFooter(footer);
  return editOrReply(context, {embed});
}

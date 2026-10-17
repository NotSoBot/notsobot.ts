import moment from 'moment';

import { Collections, Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsCommandsAllowlist } from '../../../api/structures/guildsettings';
import { getTranslator } from '../../i18n';
import { CommandCategories, EmbedColors, GuildAdminBypassLists, GuildCommandsAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, Paginator, chunkArray, displayReply, toTitleCase } from '../../../utils';

import * as ModerationAdminBypass from './moderation.adminbypass';


export const COMMAND_ID = 'server.commands.allowlist.list';

export interface CommandArgs {
  only: GuildCommandsAllowlistTypes | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {

  const guildId = context.guildId!;

  const { commandsAllowlist } = (await GuildSettingsStore.getOrFetch(context, guildId))!;
  return createCommandsAllowlistsEmbed(context, commandsAllowlist, {only: args.only});
}


const ELEMENTS_PER_PAGE = 10;

export async function createCommandsAllowlistsEmbed(
  context: Command.Context | Interaction.InteractionContext,
  commandsAllowlist: Collections.BaseCollection<string, GuildSettingsCommandsAllowlist>,
  options: {only?: GuildCommandsAllowlistTypes | null, title?: string} = {},
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const adminBypassLine = ModerationAdminBypass.getListLine(translate, GuildSettingsStore.get(context.guildId!), GuildAdminBypassLists.COMMANDS_ALLOWLIST);
  let sorted = commandsAllowlist.toArray();
  if (options.only) {
    sorted = sorted.filter((allowed) => allowed.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });

  const pages = chunkArray<GuildSettingsCommandsAllowlist>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || translate('moderation_commands_allowlist.commands_allowlisted');
  let footer = translate('moderation_commands_allowlist.command_allowlist');
  if (options.only) {
    footer = translate('moderation_commands_allowlist.only_s', {footer: footer, types: translateMaybe(`moderation.types.${options.only}`, `${toTitleCase(options.only)}s`)});
  }
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        payload.title = title;
        payload.footer = (pageLimit === 1) ? footer : translate('moderation_commands_allowlist.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((allowed, i) => {
            let type = translate('moderation_commands_allowlist.unknown', {type: allowed.type});
            switch (allowed.type) {
              case GuildCommandsAllowlistTypes.CHANNEL: {
                type = translate('moderation_commands_allowlist.channel_allowed', {allowed: allowed.id});
              }; break;
              case GuildCommandsAllowlistTypes.GUILD: {
                type = translate('moderation_commands_allowlist.guild_allowed');
              }; break;
              case GuildCommandsAllowlistTypes.ROLE: {
                type = translate('moderation_commands_allowlist.role_allowed', {allowed: allowed.id});
              }; break;
              case GuildCommandsAllowlistTypes.USER: {
                type = translate('moderation_commands_allowlist.user_allowed', {allowed: allowed.id});
              }; break;
            }
            return [
              translate('moderation_commands_allowlist.added', {addedAtText: moment(allowed.added).locale(language).fromNow(), command: allowed.command, index: ((pageNumber - 1) * ELEMENTS_PER_PAGE) + i + 1}),
              `-> ${type}`,
              translate('moderation_commands_allowlist.by', {userId: allowed.userId}),
              ModerationAdminBypass.getEntryLine(translate, allowed),
            ].filter((line): line is string => !!line).join('\n');
          });
          payload.description = ((adminBypassLine) ? [adminBypassLine, '', ...description] : description).join('\n');
        }
        return {display: payload};
      },
    });
    return await paginator.start();
  }
  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;

  payload.title = title;
  if (options.only) {
    payload.description = translate('moderation_commands_allowlist.currently_there_are_no_commands_allowlisted_for', {types: translateMaybe(`moderation.types.${options.only}`, `${toTitleCase(options.only)}s`).toLowerCase()});
  } else {
    payload.description = translate('moderation_commands_allowlist.currently_there_are_no_commands_allowlisted_in');
  }
  payload.footer = footer;
  return displayReply(context, payload);
}

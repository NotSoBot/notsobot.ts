import { Command, Interaction } from 'detritus-client';

import { deleteGuildCommandsAllowlist, editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors, GuildCommandsAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, displayReply, toTitleCase } from '../../../utils';


export interface CommandArgs {
  only: GuildCommandsAllowlistTypes | null,
}

export const COMMAND_ID = 'server.commands.allowlist.clear';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const guildId = context.guildId as string;

  const payload: DisplayPayload = {
    color: EmbedColors.DEFAULT,
    footer: translate('moderation_commands_allowlist_clear.commands_allowlist'),
    title: translate('moderation_commands_allowlist_clear.cleared_commands_allowlist'),
  };
  if (args.only) {
    // only remove one type, delete each entry so the rest of the list (and who added them) stays untouched
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    const items = (settings) ? settings.commandsAllowlist.filter((item) => item.type === args.only) : [];
    for (let item of items) {
      await deleteGuildCommandsAllowlist(context, guildId, item.command, item.id, item.type);
    }

    if (items.length) {
      const type = translateMaybe(`choices.guild_command_list_types.${args.only}`, toTitleCase(args.only));
      payload.description = translate('moderation.list_cleared_only', {amount: items.length.toLocaleString(language), type});
    } else {
      payload.description = translate('moderation.list_nothing_to_clear');
    }
  } else {
    await editGuildSettings(context, guildId, {commandsAllowlist: []});
    payload.description = translate('moderation_commands_allowlist_clear.cleared_out_the_entire_commands_allowlist_of_this');
  }

  return displayReply(context, payload);
}

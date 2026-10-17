import { Command, Interaction } from 'detritus-client';

import { deleteGuildBlocklist, editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors, GuildBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, displayReply, toTitleCase } from '../../../utils';


export interface CommandArgs {
  only?: GuildBlocklistTypes | null,
}

export const COMMAND_ID = 'server.blocklist.clear';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const guildId = context.guildId as string;

  const payload: DisplayPayload = {
    color: EmbedColors.DEFAULT,
    footer: translate('moderation_blocklist_clear.blocklist'),
    title: translate('moderation_blocklist_clear.cleared_blocklist'),
  };
  if (args.only) {
    // only remove one type, delete each entry so the rest of the list (and who added them) stays untouched
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    const items = (settings) ? settings.blocklist.filter((item) => item.type === args.only) : [];
    for (let item of items) {
      await deleteGuildBlocklist(context, guildId, item.id, item.type);
    }

    if (items.length) {
      const type = translateMaybe(`choices.guild_command_list_types.${args.only}`, toTitleCase(args.only));
      payload.description = translate('moderation.list_cleared_only', {amount: items.length.toLocaleString(language), type});
    } else {
      payload.description = translate('moderation.list_nothing_to_clear');
    }
  } else {
    await editGuildSettings(context, guildId, {blocklist: []});
    payload.description = translate('moderation_blocklist_clear.cleared_out_the_entire_blocklist_of_this');
  }

  return displayReply(context, payload);
}

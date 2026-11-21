import { Command, Interaction } from 'detritus-client';

import { editGuildSettings } from '../../../api';
import { getTranslator, TranslationKey } from '../../i18n';
import { EmbedColors, GuildPrefixCommandPermissions } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'server.rules.integrations';

export interface CommandArgs {
  // null shows the current setting
  mode: GuildPrefixCommandPermissions | null,
}

const DESCRIPTIONS: Record<GuildPrefixCommandPermissions, TranslationKey> = Object.freeze({
  [GuildPrefixCommandPermissions.OFF]: 'rules.integrations.off',
  [GuildPrefixCommandPermissions.COMMANDS]: 'rules.integrations.commands',
  [GuildPrefixCommandPermissions.ALL]: 'rules.integrations.all',
});

// which of the server's discord command permissions (Server Settings > Integrations) prefix commands follow, discord
// only applies them to slash commands. by default the ones on a command's own slash command
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId!;

  let settings = (await GuildSettingsStore.getOrFetch(context, guildId))!;
  if (args.mode !== null) {
    settings = await editGuildSettings(context, guildId, {prefixCommandPermissions: args.mode});
  }
  return displayReply(context, {
    color: EmbedColors.DEFAULT,
    description: translate(DESCRIPTIONS[settings.prefixCommandPermissions] || DESCRIPTIONS[GuildPrefixCommandPermissions.COMMANDS]),
    title: translate('rules.list.integrations_title'),
  });
}

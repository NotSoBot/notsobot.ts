import { Command, Interaction } from 'detritus-client';

import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'server.rules.admin.bypass';

export interface CommandArgs {
  // null shows the current setting
  enabled: boolean | null,
}

// if the server owner and admins skip the rules, rules made with `admins` set override it
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId!;

  let settings = (await GuildSettingsStore.getOrFetch(context, guildId))!;
  if (args.enabled !== null) {
    settings = await editGuildSettings(context, guildId, {rulesAdminBypass: args.enabled});
  }
  const enabled = (settings.settings) ? settings.settings.rulesAdminBypass : true;

  const lines = [translate((enabled) ? 'rules.list.admins_skip_all' : 'rules.list.admins_follow_all')];
  const overrides = settings.rules.filter((rule) => typeof(rule.adminBypass) === 'boolean' && rule.adminBypass !== enabled).length;
  if (overrides) {
    lines.push(`-# ${translate('rules.admin_bypass.overrides', {count: overrides.toLocaleString()})}`);
  }
  return displayReply(context, {
    color: EmbedColors.DEFAULT,
    description: lines.join('\n'),
    title: translate('rules.admin_bypass.title'),
  });
}

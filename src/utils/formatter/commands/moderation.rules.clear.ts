import { Command, Interaction } from 'detritus-client';

import { clearGuildRules } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors, StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { displayReply } from '../../../utils';

import { isGuildAdmin } from './moderation.rules';


export const COMMAND_ID = 'server.rules.clear';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId!;
  const settings = (await GuildSettingsStore.getOrFetch(context, guildId))!;

  if (!settings.rules.length) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('rules.list.empty')}`});
  }
  // removing rules that cover everything needs administrator, like adding them
  if (!isGuildAdmin(context.member) && !context.user.isClientOwner && settings.rules.some((rule) => rule.coversEverything || rule.adminBypass === false)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('rules.needs_admin')}`});
  }

  const count = settings.rules.length;
  await clearGuildRules(context, guildId);
  return displayReply(context, {
    color: EmbedColors.DEFAULT,
    description: translate('rules.clear.description', {count: count.toLocaleString()}),
    title: translate('rules.clear.title'),
  });
}

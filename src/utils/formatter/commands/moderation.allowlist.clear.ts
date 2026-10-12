import { Command, Interaction } from 'detritus-client';

import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors, GuildAllowlistTypes } from '../../../constants';
import { createUserEmbed, editOrReply } from '../../../utils';


export interface CommandArgs {
  only?: GuildAllowlistTypes | null,
}

export const COMMAND_ID = 'allowlist.clear';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const guildId = context.guildId as string;

  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  if (args.only) {
    embed.setTitle('WIP');
    embed.setDescription(args.only);
  } else {
    embed.setTitle(translate('moderation_allowlist_clear.cleared_allowlist'));
    embed.setDescription(translate('moderation_allowlist_clear.cleared_out_the_entire_allowlist_of_this'));
    embed.setFooter(translate('moderation_allowlist_clear.allowlist'));

    const settings = await editGuildSettings(context, guildId, {allowlist: []});
  }

  return editOrReply(context, {embed});
}

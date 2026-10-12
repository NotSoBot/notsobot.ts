import { Command, Interaction } from 'detritus-client';

import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors, GuildBlocklistTypes } from '../../../constants';
import { createUserEmbed, editOrReply } from '../../../utils';


export interface CommandArgs {
  only?: GuildBlocklistTypes | null,
}

export const COMMAND_ID = 'blocklist.clear';

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
    embed.setTitle(translate('moderation_blocklist_clear.cleared_blocklist'));
    embed.setDescription(translate('moderation_blocklist_clear.cleared_out_the_entire_blocklist_of_this'));
    embed.setFooter(translate('moderation_blocklist_clear.blocklist'));

    const settings = await editGuildSettings(context, guildId, {blocklist: []});
  }

  return editOrReply(context, {embed});
}

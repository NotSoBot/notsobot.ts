import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';

import { displayBlockedUntil, getBlockedUntil } from './owner.block.user';


export interface CommandArgsBefore {
  duration?: number,
  guild: Structures.Guild | null,
}

export interface CommandArgs {
  duration?: number,
  guild: Structures.Guild,
}


export const COMMAND_ID = 'owner.block.guild';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const { guild } = args;
  const until = getBlockedUntil(args.duration);
  if (until === undefined) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('owner_block.invalid_duration')}`});
  }

  await editGuildSettings(context, guild.id, {blocked: true, blockedUntil: (until) ? until.toISOString() : null});
  const description = translate('owner_block_guild.alright_blocked_guild', {guild: guild.id, name: Markup.escape.all(guild.name)});
  return displayReply(context, {description: description + displayBlockedUntil(translate, until)});
}

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildPrefix } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors } from '../../../constants';

import { DisplayPayload, displayReply } from '../../tools';

import * as PrefixesList from './prefixes.list';


export const COMMAND_ID = 'prefixes.remove';

export interface CommandArgs {
  prefix: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const guildId = context.guildId!;

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = translate('prefixes_remove.remove_prefix', {prefix: Markup.escape.all(args.prefix)});

  const prefixes = await deleteGuildPrefix(context, guildId, args.prefix);
  PrefixesList.formatPrefixes(context, prefixes, payload);

  return displayReply(context, payload);
}

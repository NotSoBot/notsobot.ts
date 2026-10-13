import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors } from '../../../constants';

import { DisplayPayload, displayReply } from '../../tools';

import * as PrefixesList from './prefixes.list';


export const COMMAND_ID = 'prefixes.replace';

export interface CommandArgs {
  prefix: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const guildId = context.guildId as string;

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = translate('prefixes_replace.replaced_prefixes_with', {prefix: Markup.escape.all(args.prefix)});

  const { prefixes } = await editGuildSettings(context, guildId, {prefixes: [args.prefix]});
  PrefixesList.formatPrefixes(context, prefixes, payload);

  return displayReply(context, payload);
}

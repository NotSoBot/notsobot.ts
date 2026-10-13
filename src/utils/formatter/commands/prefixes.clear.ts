import { Command, Interaction } from 'detritus-client';

import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors } from '../../../constants';

import { DisplayPayload, displayReply } from '../../tools';

import * as PrefixesList from './prefixes.list';


export const COMMAND_ID = 'prefixes.clear';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const guildId = context.guildId!;

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = translate('prefixes_clear.cleared_prefixes');

  const { prefixes } = await editGuildSettings(context, guildId, {prefixes: []});
  PrefixesList.formatPrefixes(context, prefixes, payload);

  return displayReply(context, payload);
}

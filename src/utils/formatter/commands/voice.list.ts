import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import MiniSearch from 'minisearch';

import { deleteVoice, fetchUserVoices } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';
import { DisplayPayload, displayReply } from '../../../utils';


export const COMMAND_ID = 'voice.list';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (!voices.length) {
    return displayReply(context, {description: translate('voice_list.you_have_no_cloned_voices')});
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('voice_list.cloned_voices');

  const description: Array<string> = [];
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    description.push(`${i + 1}. ${Markup.codestring(voice.name)}`);
  }
  payload.description = description.join('\n');

  return displayReply(context, payload);
}


export function findVoice(
  voices: Array<RestResponsesRaw.Voice>,
  voice: string,
): {id: string, name: string} | null {
  const search = new MiniSearch({
    fields: ['id', 'name'],
    storeFields: ['id', 'name'],
    searchOptions: {
      boost: {name: 2},
      fuzzy: true,
      prefix: true,
      weights: {fuzzy: 0.2, prefix: 1},
    },
  });
  search.addAll(voices);

  const results = search.search(voice);
  if (results.length) {
    return results[0] as unknown as {id: string, name: string};
  }
  return null;
}

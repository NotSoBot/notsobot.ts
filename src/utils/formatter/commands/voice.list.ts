import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import MiniSearch from 'minisearch';

import { deleteVoice, fetchUserVoices } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';
import { createUserEmbed, editOrReply } from '../../../utils';


export const COMMAND_ID = 'voice.list';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (!voices.length) {
    return editOrReply(context, 'You have no cloned voices');
  }

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter('Cloned Voices');

  const description: Array<string> = [];
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    description.push(`${i + 1}. ${Markup.codestring(voice.name)}`);
  }
  embed.setDescription(description.join('\n'));

  return editOrReply(context, {embed});
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

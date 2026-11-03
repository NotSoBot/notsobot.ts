import { Command, Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import MiniSearch from 'minisearch';

import { getPremiumServerId } from '../../../stores/premiumservers';
import { fetchServerVoices, fetchUserVoices } from '../../../api';
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

// the api's `MAX_SERVER_VOICE_CLONE_AMOUNT`
export const MAX_SERVER_VOICES = 5;

export interface CommandArgs {
  // the server's voices instead of the user's
  server?: boolean,
}

// why the user can't use (or with `manage`, change) the voices of the server it's used in, null when they can. The api
// only checks the voice belongs to that server, Manage Server (a group dm's owner) is checked here
export function serverVoicesProblem(
  context: Command.Context | Interaction.InteractionContext,
  manage: boolean,
): null | 'premium_servers.only_in_a_server' | 'voice_server.manage_required' {
  if (!getPremiumServerId(context)) {
    return 'premium_servers.only_in_a_server';
  }
  if (manage) {
    if (context.guildId) {
      const member = context.member;
      if (!member || !(member.isOwner || member.can(Permissions.MANAGE_GUILD))) {
        return 'voice_server.manage_required';
      }
    } else if (!context.channel || context.channel.ownerId !== context.userId) {
      return 'voice_server.manage_required';
    }
  }
  return null;
}

// the user's own voices, or with `server` the server's it's used in
export async function fetchVoices(
  context: Command.Context | Interaction.InteractionContext,
  server?: boolean,
): Promise<Array<RestResponsesRaw.Voice>> {
  if (server) {
    return (await fetchServerVoices(context)).voices;
  }
  return (await fetchUserVoices(context, context.userId)).voices;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  if (args.server) {
    const problem = serverVoicesProblem(context, false);
    if (problem) {
      return displayReply(context, {description: translate(problem)});
    }
  }

  const voices = await fetchVoices(context, args.server);
  if (!voices.length) {
    if (args.server) {
      return displayReply(context, {description: translate('voice_server.no_voices', {max: MAX_SERVER_VOICES})});
    }
    return displayReply(context, {description: translate('voice_list.you_have_no_cloned_voices')});
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = (args.server) ? translate('voice_server.voices', {count: voices.length, max: MAX_SERVER_VOICES}) : translate('voice_list.cloned_voices');

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
  exact: boolean = false,
): {id: string, name: string} | null {
  if (exact) {
    // for anything destructive, fuzzy matching could pick a different voice (`bob` deleting `rob`)
    const query = voice.trim().toLowerCase();
    const found = voices.find((x) => x.id === query) || voices.find((x) => x.name.toLowerCase() === query);
    return (found) ? {id: found.id, name: found.name} : null;
  }

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

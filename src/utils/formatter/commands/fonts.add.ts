import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import SavedFontsStore from '../../../stores/savedfonts';
import { getTranslator } from '../../i18n';

import { createSavedFont } from '../../../api';
import { displayReply } from '../../../utils';

import { fetchScopedFonts } from './fonts.list';


export const COMMAND_ID = 'fonts.add';

export interface CommandArgs {
  name: string,
  // the server's instead of their own, needs Manage Server
  server?: boolean,
  // the font file (an attachment's or a link), the api downloads and checks it
  url?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { translate } = translator;
  if (!args.url) {
    return displayReply(context, {description: translate('fonts.add_needs_file'), ephemeral: true});
  }

  // premium, the limit, the name and the file itself are the api's to check
  const scoped = await fetchScopedFonts(context, translator, args.server);
  if (!scoped) {
    return;
  }

  const response = await createSavedFont(context, {guildId: scoped.guildId, name: args.name, url: args.url});
  SavedFontsStore.insert(context, response, scoped.guildId);

  const name = Markup.codestring(response.font.name);
  return displayReply(context, {
    description: translate((scoped.guildId) ? 'fonts.added_server' : 'fonts.added', {name}),
    note: translate('fonts.note', {example: Markup.codestring(`loadfont ${response.font.name}`)}),
  });
}

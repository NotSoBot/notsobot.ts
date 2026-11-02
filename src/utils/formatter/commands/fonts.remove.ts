import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import SavedFontsStore from '../../../stores/savedfonts';
import { getTranslator } from '../../i18n';

import { deleteSavedFont } from '../../../api';
import { displayReply } from '../../../utils';

import { fetchScopedFonts, findScopedFont } from './fonts.list';


export const COMMAND_ID = 'fonts.remove';

export interface CommandArgs {
  name: string,
  server?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { translate } = translator;
  const scoped = await fetchScopedFonts(context, translator, args.server);
  if (!scoped) {
    return;
  }

  // the exact name, nothing destructive goes by a fuzzy match
  const font = findScopedFont(scoped.fonts, args.name);
  if (!font) {
    const name = Markup.codestring(args.name.slice(0, 32));
    return displayReply(context, {description: translate((scoped.guildId) ? 'fonts.unknown_server' : 'fonts.unknown', {name}), ephemeral: true});
  }

  const response = await deleteSavedFont(context, font.name, {guildId: scoped.guildId});
  SavedFontsStore.insert(context, response, scoped.guildId);

  const name = Markup.codestring(font.name);
  return displayReply(context, {description: translate((scoped.guildId) ? 'fonts.removed_server' : 'fonts.removed', {name})});
}

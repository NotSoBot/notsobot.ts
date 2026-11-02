import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import SavedFontsStore from '../../../stores/savedfonts';
import { getTranslator } from '../../i18n';

import { editSavedFont } from '../../../api';
import { displayReply } from '../../../utils';

import { fetchScopedFonts, findScopedFont } from './fonts.list';


export const COMMAND_ID = 'fonts.rename';

export interface CommandArgs {
  name: string,
  // its new name
  newName: string,
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

  const font = findScopedFont(scoped.fonts, args.name);
  if (!font) {
    const name = Markup.codestring(args.name.slice(0, 32));
    return displayReply(context, {description: translate((scoped.guildId) ? 'fonts.unknown_server' : 'fonts.unknown', {name}), ephemeral: true});
  }

  // a Default Font setting using it follows the new name (the api changes it)
  const response = await editSavedFont(context, font.name, {guildId: scoped.guildId, name: args.newName});
  SavedFontsStore.insert(context, response, scoped.guildId);

  return displayReply(context, {
    description: translate('fonts.renamed', {name: Markup.codestring(font.name), name2: Markup.codestring(response.font.name)}),
  });
}

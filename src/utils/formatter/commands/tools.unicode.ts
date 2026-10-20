import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { utilitiesUnicode } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { DisplayPayload, displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.unicode';

export const MAX_CHARACTERS = 25;

// invisible or unassigned characters, only their name is shown
const CATEGORIES_HIDDEN = ['Cc', 'Cf', 'Cn', 'Co', 'Cs', 'Zl', 'Zp', 'Zs'];
// combining marks are shown on a dotted circle so they don't merge into the text before them
const CATEGORIES_COMBINING = ['Mc', 'Me', 'Mn'];

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language } = await getTranslator(context);

  // regular spaces just separate the characters, other spaces are kept since those are usually what's being looked up
  const text = args.text.replace(/ /g, '') || args.text;
  const { characters, count, version } = await utilitiesUnicode(context, {limit: MAX_CHARACTERS, query: text});

  const payload: DisplayPayload = {};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = displayDetailsLine([
    `Unicode ${version}`,
    (characters.length < count) && `${characters.length.toLocaleString(language)}/${count.toLocaleString(language)}`,
  ]);
  payload.footerIconUrl = EmbedBrands.NOTSOBOT;

  payload.description = displayDetails(characters.map((character) => {
    const hex = character.code_point.toString(16).toUpperCase().padStart(4, '0');

    let glyph: string | null = null;
    if (CATEGORIES_COMBINING.includes(character.category)) {
      glyph = `◌${character.character}`;
    } else if (!CATEGORIES_HIDDEN.includes(character.category)) {
      glyph = Markup.escape.all(character.character);
    }

    const url = `https://www.fileformat.info/info/unicode/char/${hex.toLowerCase()}/index.htm`;
    return [
      Markup.codestring(`U+${hex}`),
      glyph,
      Markup.url(Markup.escape.all(character.name), `<${url}>`),
    ].filter(Boolean).join(' ');
  }));

  return displayReply(context, payload);
}

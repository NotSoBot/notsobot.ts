import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import SavedFontsStore from '../../../stores/savedfonts';
import { Translator, getTranslator } from '../../i18n';

import { fetchSavedFonts } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import { displayDetailsLine, displayReply, displayTimestamp, formatMemory } from '../../../utils';
import { normalizeSavedFontName } from '../../parameters/fonts';


export const COMMAND_ID = 'fonts.list';

export interface CommandArgs {
  // the server's instead of their own (`server fonts`), any member can list them
  server?: boolean,
}

// the saved fonts a change applies to, the server's (`server`) or their own. null after replying why it can't
export async function fetchScopedFonts(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  server?: boolean,
): Promise<null | {fonts: RestResponsesRaw.SavedFonts | null, guildId?: string}> {
  const { translate } = translator;
  if (server) {
    if (!context.guildId) {
      await displayReply(context, {description: translate('fonts.server_only'), ephemeral: true});
      return null;
    }
    // the api trusts the bot with this, anyone in the server could list them but only managers change them
    if (!context.member || !context.member.canManageGuild) {
      await displayReply(context, {description: translate('fonts.server_needs_manage'), ephemeral: true});
      return null;
    }
  }

  // fresh, someone else (or the dashboard) could have changed them since they were cached
  const payload = await fetchSavedFonts(context);
  if (payload.user) {
    SavedFontsStore.insert(context, payload.user);
  }
  if (payload.guild && context.guildId) {
    SavedFontsStore.insert(context, payload.guild, context.guildId);
  }
  if (server) {
    return {fonts: payload.guild, guildId: context.guildId!};
  }
  return {fonts: payload.user};
}

export function findScopedFont(fonts: RestResponsesRaw.SavedFonts | null, name: string): RestResponsesRaw.SavedFont | null {
  const normalized = normalizeSavedFontName(name);
  return (fonts) ? fonts.items.find((font) => font.name === normalized) || null : null;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  if (args.server && !context.guildId) {
    return displayReply(context, {description: translate('fonts.server_only'), ephemeral: true});
  }

  const payload = await fetchSavedFonts(context);
  if (payload.user) {
    SavedFontsStore.insert(context, payload.user);
  }
  if (payload.guild && context.guildId) {
    SavedFontsStore.insert(context, payload.guild, context.guildId);
  }
  const fonts = (args.server) ? payload.guild : payload.user;

  const lines: Array<string> = [];
  if (fonts && fonts.items.length) {
    for (let font of fonts.items) {
      lines.push(displayDetailsLine([
        Markup.codestring(font.name),
        formatMemory(font.size, (font.size < 1024 * 1024) ? 0 : 1),
        displayTimestamp(font.created),
      ]));
    }
  } else {
    lines.push(translate('fonts.list_empty'));
  }
  if (fonts && !fonts.premium) {
    lines.push(`-# ${translate((args.server) ? 'fonts.list_server_needs_premium' : 'fonts.list_needs_premium')}`);
  }

  const count = (fonts) ? ` (${fonts.items.length.toLocaleString(language)}/${fonts.limit.toLocaleString(language)})` : '';
  const example = fonts?.items[0]?.name || 'comic';
  return displayReply(context, {
    color: EmbedColors.DEFAULT,
    description: lines.join('\n'),
    note: translate('fonts.note', {example: Markup.codestring(`loadfont ${example}`)}),
    title: `${translate('fonts.list_title')} • ${translate((args.server) ? 'fonts.list_server' : 'fonts.list_yours')}${count}`,
  });
}

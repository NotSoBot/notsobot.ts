import { Command, Interaction } from 'detritus-client';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayDetails, displayReply } from '../../../utils';
import { Translator, getTranslator } from '../../i18n';

import { canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.crossfade';

// the api's limit
export const MAX_MUSIC_CROSSFADE = 12;

export interface CommandArgs {
  // seconds, 0 turns it off, null shows it
  seconds: number | null,
}

// crossfade, a premium server perk (set either way, it only fades with premium): the end of each track fades into the
// next for this many seconds. Without it the node still plays them gaplessly. Changing it needs manage server or the
// dj role
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  let music: RestResponsesRaw.FetchGuildMusic;
  if (args.seconds === null) {
    music = await fetchGuildMusic(context, guildId);
  } else {
    if (!canManageMusic(context.member)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
    }
    const seconds = Math.min(Math.max(Math.round(args.seconds), 0), MAX_MUSIC_CROSSFADE);
    music = await editGuildMusic(context, guildId, {crossfade: seconds});
  }
  return displayReply(context, {description: crossfadeText(translate, language, music)});
}


// how long (and that it needs premium without it), or that it's off
function crossfadeText(translate: Translator['translate'], language: string, music: RestResponsesRaw.FetchGuildMusic): string {
  if (!music.crossfade) {
    return translate('music_crossfade.off');
  }
  return displayDetails([
    translate('music_crossfade.on', {seconds: music.crossfade.toLocaleString(language)}),
    (music.premium) ? null : `-# ${translate('music_crossfade.needs_premium')}`,
  ]);
}

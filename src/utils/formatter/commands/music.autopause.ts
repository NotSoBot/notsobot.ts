import { Command, Interaction } from 'detritus-client';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayDetails, displayReply, formatDuration } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getTranslator } from '../../i18n';

import { canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.autopause';

// the api's limit (seconds)
export const MAX_MUSIC_PAUSE_TIMEOUT = 5 * 60;

export interface CommandArgs {
  // pausing when nobody else in the channel can hear it, on for every server and only a premium one can turn it off.
  // null leaves it
  enabled: boolean | null,
  // seconds paused before the bot leaves with the track held (0 right away), without 24/7. null leaves it
  leaveAfter: number | null,
}

// auto pause: the bot pauses when everyone else in its channel has left or deafened (bots don't count), and carries on
// when someone can hear it again. Paused (by anyone) for `leaveAfter` it leaves with the track held, unless 24/7 keeps
// it. Nothing given shows both, changing them needs manage server or the dj role
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  let music = await fetchGuildMusic(context, guildId);
  if (args.enabled === null && args.leaveAfter === null) {
    return displayReply(context, {description: autopauseText(translate, language, music)});
  }
  if (!canManageMusic(context.member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
  }
  if (args.enabled === false && !music.premium) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_autopause.needs_premium')}`});
  }
  const pauseTimeout = (args.leaveAfter === null) ? undefined : Math.min(Math.max(Math.round(args.leaveAfter), 0), MAX_MUSIC_PAUSE_TIMEOUT);
  music = await editGuildMusic(context, guildId, {
    pauseAlone: (args.enabled === null) ? undefined : args.enabled,
    pauseTimeout,
  });
  if (args.enabled !== null) {
    // everyone might have left already, or it was paused alone and shouldn't stay that way
    VoiceNode.handleListeners(guildId);
  }
  return displayReply(context, {description: autopauseText(translate, language, music)});
}


// whether it pauses alone, and how long it stays paused before leaving (for good with 24/7)
function autopauseText(translate: Translator['translate'], language: string, music: RestResponsesRaw.FetchGuildMusic): string {
  let leave: string;
  if (music.stay && music.premium) {
    leave = translate('music_autopause.leave_stay');
  } else if (!music.pause_timeout) {
    leave = translate('music_autopause.leave_instant');
  } else {
    leave = translate('music_autopause.leave_after', {length: formatDuration(music.pause_timeout * 1000, language)});
  }
  return displayDetails([
    translate((music.pause_alone) ? 'music_autopause.on' : 'music_autopause.off'),
    `-# ${leave}`,
  ]);
}

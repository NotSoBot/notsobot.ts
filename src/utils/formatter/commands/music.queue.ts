import { Command, Interaction } from 'detritus-client';

import { fetchGuildMusic } from '../../../api';
import { displayDetails, displayDetailsLine, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { musicItemLine } from './music.shared';


// the rest are counted in a line at the end
const MAX_SHOWN = 15;

export const COMMAND_ID = 'music.queue';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { language, translate } = await getTranslator(context);

  if (!context.guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const music = await fetchGuildMusic(context, context.guildId);
  if (!music.current && !music.queue.length) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  let currentLine: null | string = null;
  if (music.current) {
    const player = await VoiceNode.getPlayer(context.guildId);
    const position = (player) ? player.state.position : 0;
    const duration = (music.current.track) ? formatTime(music.current.track.duration) : '?';
    currentLine = musicItemLine(music.current, (player && player.paused) ? '⏸️' : '▶️', `${formatTime(position)} / ${duration}`);
  }

  const shown = music.queue.slice(0, MAX_SHOWN);
  const more = music.queue.length - shown.length;
  return displayReply(context, {
    description: displayDetails([
      currentLine,
      (currentLine) ? '' : null,
      ...shown.map((item) => musicItemLine(item, `**${item.position}.**`, (item.track) ? formatTime(item.track.duration) : null)),
      (music.queue.length) ? null : translate('music_queue.empty'),
      (more) ? displayDetailsLine([translate('music_queue.more', {count: more.toLocaleString(language)})], true) : null,
    ]),
    title: translate('music_queue.title'),
  });
}

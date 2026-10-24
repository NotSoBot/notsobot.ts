import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { fetchMusicDjRefusal, musicPlaybackText } from './music.shared';


export const COMMAND_ID = 'music.seek';

export interface CommandArgs {
  // seconds
  position: number,
}

export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  if (context.guildId) {
    // dj mode: only djs control it
    const refusal = await fetchMusicDjRefusal(context, translate, context.guildId, context.member);
    if (refusal) {
      return displayReply(context, {description: refusal});
    }
  }
  const position = Math.round(args.position * 1000);
  const player = (context.guildId) ? await VoiceNode.seek(context.guildId, position) : null;
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  // `Seeked to 2:00 • artist - title`, where that is of how long it is under it
  const music = await fetchGuildMusic(context, context.guildId!).catch(() => null);
  return displayReply(context, {
    description: musicPlaybackText(
      translate('music_seek.seeked_to', {position: Markup.codestring(formatTime(player.position))}),
      (music) ? music.current : null,
      player.position,
    ),
  });
}

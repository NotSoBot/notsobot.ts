import { Command, Interaction, Structures } from 'detritus-client';

import { deleteGuildMusicQueue, fetchGuildMusic } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { canManageMusic, musicItemsAtPositions } from './music.shared';


export const COMMAND_ID = 'music.queue.clear';

export interface CommandArgs {
  // only this user's queued tracks
  from?: null | Structures.Member | Structures.User,
  // only the album/playlist the track at this position was queued with
  playlist?: null | number,
}

// anyone can clear what they queued, other people's need manage server or the dj role (a queue with only
// theirs in it can be cleared too)
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  if (!context.guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  // by a position, not its name (two can have the same one): what's still queued of it goes
  if (args.playlist) {
    const music = await fetchGuildMusic(context, context.guildId);
    // as shown, #1 is what's playing
    const [ item ] = musicItemsAtPositions(music, [args.playlist]);
    if (!item) {
      return displayReply(context, {description: translate('music_queue_remove.no_tracks_at_positions')});
    }
    if (!item.batch_id) {
      return displayReply(context, {description: translate('music_queue_clear.not_from_playlist', {position: args.playlist.toLocaleString(language)})});
    }
    const items = music.queue.filter((x) => x.batch_id === item.batch_id);
    if (items.some((x) => x.user_id !== context.userId) && !canManageMusic(context.member)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_queue_remove.not_yours')}`});
    }
    const { deleted } = await deleteGuildMusicQueue(context, context.guildId, {batchId: item.batch_id});
    return displayReply(context, {description: translate('music_queue_remove.removed', {count: deleted.toLocaleString(language)})});
  }

  let userId = (args.from) ? args.from.id : undefined;
  if (userId !== context.userId && !canManageMusic(context.member)) {
    const music = await fetchGuildMusic(context, context.guildId);
    const others = music.queue.some((item) => item.user_id !== context.userId && (!userId || item.user_id === userId));
    if (others) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_queue_remove.not_yours')}`});
    }
    // only theirs, even if someone queued something since
    userId = userId || context.userId;
  }
  const { deleted } = await deleteGuildMusicQueue(context, context.guildId, {userId});
  return displayReply(context, {description: translate('music_queue_remove.removed', {count: deleted.toLocaleString(language)})});
}

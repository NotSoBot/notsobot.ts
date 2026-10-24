import { Command, Interaction, Structures } from 'detritus-client';

import { editGuildMusicSession, fetchGuildMusic } from '../../../api';
import { RequestContext } from '../../../api/raw';
import { RestResponsesRaw } from '../../../api/types';
import { displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getTranslator } from '../../i18n';

import { fetchMusicDjRefusal, musicItemDetails, musicItemTitle } from './music.shared';


export const COMMAND_ID = 'music.replay';

// what's playing back to the start, playing or paused as it was (the button too, `onMusicControl`). From our channel
// while we're in one. Disconnected or held (we left) it stays held at the start for the next resume or play.
// `message` says it went back, or why it didn't
export async function replayMusic(
  context: RequestContext,
  translate: Translator['translate'],
  guildId: string,
  member?: null | Structures.Member,
): Promise<{done: boolean, message: string}> {
  const guild = VoiceNode.guilds.get(guildId);
  // in voice: the node seeks first (the title's only for the reply), so the jump isn't waiting on the api
  if (guild) {
    if (!guild.disconnected) {
      const channel = (member && member.voiceState) ? member.voiceState.channel : null;
      if (!channel || channel.id !== guild.channelId) {
        return {done: false, message: translate('music_controls.join_my_channel', {channel: `<#${guild.channelId}>`})};
      }
    }
    if (!await VoiceNode.replay(guildId)) {
      return {done: false, message: translate('music.nothing_playing')};
    }
    const music = await fetchGuildMusic(context, guildId).catch(() => null);
    return {done: true, message: replayingText(translate, (music) ? music.current : null)};
  }

  // held (we left): it stays held, at the start for the next resume or play
  const music = await fetchGuildMusic(context, guildId).catch(() => null);
  if (!music || !music.current || music.held_position === null) {
    return {done: false, message: translate('music.nothing_playing')};
  }
  await editGuildMusicSession(context, guildId, {position: 0});
  return {done: true, message: replayingText(translate, music.current)};
}

// `Back to the start of artist - title`, then its length and who requested it
function replayingText(translate: Translator['translate'], item: null | RestResponsesRaw.GuildMusicQueueItem): string {
  if (!item) {
    return translate('music_replay.replaying', {title: '?'});
  }
  return displayDetails([
    translate('music_replay.replaying', {title: `**${musicItemTitle(item)}**`}),
    displayDetailsLine(musicItemDetails(translate, item), true),
  ]);
}

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);
  if (!context.guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  // dj mode: only djs control it
  const refusal = await fetchMusicDjRefusal(context, translate, context.guildId, context.member);
  if (refusal) {
    return displayReply(context, {description: refusal});
  }
  const { message } = await replayMusic(context, translate, context.guildId, context.member);
  return displayReply(context, {description: message});
}

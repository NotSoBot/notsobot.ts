import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { displayDetails, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { MusicVoteKinds, clearMusicVotes, fetchMusicDjRefusal, musicItemTitle, musicListeningTime, musicPlaybackText, musicPlayerSpeed, musicVote } from './music.shared';


export const COMMAND_ID = 'music.resume';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  // `Resumed at 1:23 • artist - title`, where it carries on of how long it is under it (and the channel it joined), how
  // long they take at the speed
  const resumedText = (position: number, item: null | RestResponsesRaw.GuildMusicQueueItem, channel?: string, speed: number = 1): string => {
    return musicPlaybackText(
      translate('music_resume.resumed_at', {position: Markup.codestring(formatTime(musicListeningTime(position, speed)))}),
      item,
      position,
      [(channel) ? translate('music_play.now_playing', {channel}) : null],
      speed,
    );
  };
  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;
  if (context.guildId) {
    // dj mode: only djs control it
    const refusal = await fetchMusicDjRefusal(context, translate, context.guildId, context.member);
    if (refusal) {
      return displayReply(context, {description: refusal});
    }
  }

  // held (paused too long, or `music leave` kept the queue): we left, it carries on in their channel like `music play`
  if (context.guildId && !VoiceNode.guilds.has(context.guildId)) {
    const music = await fetchGuildMusic(context, context.guildId).catch(() => null);
    if (!music || !music.current || music.held_position === null) {
      return displayReply(context, {description: translate('music.nothing_playing')});
    }
    if (!channel) {
      return displayReply(context, {description: translate('music_play.go_join_a_voice_channel')});
    }
    if (!channel.canJoin || !channel.canSpeak) {
      return displayReply(context, {description: translate('music_play.cannot_join_ur_channel')});
    }
    const resumed = await VoiceNode.resumeHeld(context, context.client, context.guildId, channel.id);
    if (!resumed) {
      return displayReply(context, {description: translate('music.nothing_playing')});
    }
    return displayReply(context, {description: resumedText(resumed.position, music.current, channel.mention)});
  }

  // someone disconnected us, the held track carries on in their channel
  if (context.guildId && VoiceNode.isDisconnected(context.guildId)) {
    if (!channel) {
      return displayReply(context, {description: translate('music_play.go_join_a_voice_channel')});
    }
    if (!channel.canJoin || !channel.canSpeak) {
      return displayReply(context, {description: translate('music_play.cannot_join_ur_channel')});
    }
    const player = await VoiceNode.getPlayer(context.guildId);
    if (!player || !player.track || !VoiceNode.reconnect(context.guildId, channel.id)) {
      return displayReply(context, {description: translate('music.nothing_playing')});
    }
    const music = await fetchGuildMusic(context, context.guildId).catch(() => null);
    return displayReply(context, {description: resumedText(player.position, (music) ? music.current : null, channel.mention)});
  }

  // playing: from our channel, with the server's vote resume on someone else's paused track is a vote (`musicVote`)
  // unless you manage the music (or it's only two of you listening), so one person can't undo a pause everyone voted for
  const guild = (context.guildId) ? VoiceNode.guilds.get(context.guildId) : undefined;
  // the vote's fetch, kept for the reply
  let fetched: null | RestResponsesRaw.FetchGuildMusic = null;
  // still connecting (just joined to play, or rejoining after a restart) counts as playing, a rejoin's held pause too
  const starting = !!guild && VoiceNode.isStarting(context.guildId!);
  if (guild && guild.channelId && (starting || VoiceNode.isPlaying(context.guildId!))) {
    if (!member || !channel || channel.id !== guild.channelId) {
      return displayReply(context, {description: translate('music_controls.join_my_channel', {channel: `<#${guild.channelId}>`})});
    }
    if ((starting) ? !!(guild.resumeAt && guild.resumeAt.paused) : guild.paused) {
      const music = fetched = await fetchGuildMusic(context, context.guildId!);
      if (music.current) {
        const vote = musicVote(MusicVoteKinds.RESUME, member, channel, music.current, music.vote_resume);
        if (!vote.done) {
          return displayReply(context, {
            description: displayDetails([
              translate('music_resume.voted', {title: `**${musicItemTitle(music.current)}**`, votes: `${vote.votes}/${vote.needed}`}),
              `-# ${translate('music_vote_resume.explanation')}`,
            ]),
          });
        }
      }
    }
  }
  // it carries on unpaused once it's in voice
  const startingAt = (starting) ? VoiceNode.resumeStarting(context.guildId!) : null;
  if (startingAt !== null) {
    clearMusicVotes(MusicVoteKinds.PAUSE, context.guildId!);
    const music = fetched || await fetchGuildMusic(context, context.guildId!).catch(() => null);
    return displayReply(context, {description: resumedText(startingAt, (music) ? music.current : null, undefined, guild!.speed)});
  }
  const player = (context.guildId) ? await VoiceNode.setPaused(context.guildId, false) : null;
  if (!player) {
    // in voice with the node's next track not on yet (a link converting, the api being asked again): unpaused already,
    // it starts once it's ready
    if (context.guildId && VoiceNode.isPlaying(context.guildId)) {
      clearMusicVotes(MusicVoteKinds.PAUSE, context.guildId);
      const music = fetched || await fetchGuildMusic(context, context.guildId).catch(() => null);
      return displayReply(context, {description: resumedText(0, (music) ? music.current : null)});
    }
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  clearMusicVotes(MusicVoteKinds.PAUSE, context.guildId!);
  const music = fetched || await fetchGuildMusic(context, context.guildId!).catch(() => null);
  return displayReply(context, {description: resumedText(player.position, (music) ? music.current : null, undefined, musicPlayerSpeed(player))});
}

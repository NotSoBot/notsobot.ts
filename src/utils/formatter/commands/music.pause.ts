import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { MusicVoteKinds, clearMusicVotes, musicItemTitle, musicVote } from './music.shared';


export const COMMAND_ID = 'music.pause';

// pausing needs you in our channel, with the server's vote pause on someone else's track is a vote (`musicVote`) unless
// you manage the music (or it's only two of you listening). Resuming is its own vote (`music resume`)
export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  const guild = (guildId) ? VoiceNode.guilds.get(guildId) : undefined;
  if (!guildId || !guild || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;
  if (!member || !channel || channel.id !== guild.channelId) {
    return displayReply(context, {description: translate('music_controls.join_my_channel', {channel: `<#${guild.channelId}>`})});
  }
  const music = await fetchGuildMusic(context, guildId);
  if (music.current) {
    const vote = musicVote(MusicVoteKinds.PAUSE, member, channel, music.current, music.vote_pause);
    if (!vote.done) {
      return displayReply(context, {
        description: translate('music_pause.voted', {title: musicItemTitle(music.current), votes: `${vote.votes}/${vote.needed}`}),
      });
    }
  }

  const player = await VoiceNode.setPaused(guildId, true);
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  clearMusicVotes(MusicVoteKinds.RESUME, guildId);
  return displayReply(context, {
    description: translate('music_pause.paused_at', {position: Markup.codestring(formatTime(player.position))}),
  });
}

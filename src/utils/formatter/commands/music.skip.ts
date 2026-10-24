import { Command, Interaction } from 'detritus-client';

import { fetchGuildMusic } from '../../../api';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { MusicVoteKinds, musicItemTitle, musicVote } from './music.shared';


export const COMMAND_ID = 'music.skip';

// skipping needs you in our channel, with the server's vote skip on it's a vote unless you queued it (or manage the music,
// or it's only you)
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

  // what's playing before it's skipped, for the reply
  const music = await fetchGuildMusic(context, guildId);
  if (!music.current) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const vote = musicVote(MusicVoteKinds.SKIP, member, channel, music.current, music.vote_skip);
  if (!vote.done) {
    return displayReply(context, {
      description: translate('music_skip.voted', {title: musicItemTitle(music.current), votes: `${vote.votes}/${vote.needed}`}),
    });
  }
  if (!await VoiceNode.skip(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  return displayReply(context, {description: translate('music_skip.skipped', {title: musicItemTitle(music.current)})});
}

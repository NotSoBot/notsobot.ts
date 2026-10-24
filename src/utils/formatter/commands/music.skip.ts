import { Command, Interaction } from 'detritus-client';

import { fetchGuildMusic } from '../../../api';
import { MusicLoopModes } from '../../../constants';
import { displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { MusicVoteKinds, musicDjRefusal, musicItemDetails, musicItemTitle, musicVote } from './music.shared';


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

  // what's playing before it's skipped and what's next, for the reply
  const music = await fetchGuildMusic(context, guildId);
  // dj mode: only djs control it, no votes
  const refusal = musicDjRefusal(translate, member, music);
  if (refusal) {
    return displayReply(context, {description: refusal});
  }
  if (!music.current) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const title = `**${musicItemTitle(music.current)}**`;

  const vote = musicVote(MusicVoteKinds.SKIP, member, channel, music.current, music.vote_skip);
  if (!vote.done) {
    return displayReply(context, {
      description: displayDetails([
        translate('music_skip.voted', {title, votes: `${vote.votes}/${vote.needed}`}),
        `-# ${translate('music_vote_skip.explanation')}`,
      ]),
    });
  }

  if (!await VoiceNode.skip(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  // the track loop goes on to the next one too, the queue loop puts the skipped one back at the end
  const next = music.queue[0] || ((music.loop === MusicLoopModes.QUEUE) ? music.current : null);
  return displayReply(context, {
    description: displayDetails([
      translate('music_skip.skipped', {title}),
      (next) ?
        displayDetailsLine([translate('music_queue.up_next'), `**${musicItemTitle(next)}**`, ...musicItemDetails(translate, next)], true) :
        `-# ${translate('music_info.nothing_after')}`,
    ]),
  });
}

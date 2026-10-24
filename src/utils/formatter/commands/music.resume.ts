import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { displayDetailsLine, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.resume';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);
  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;

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
    return displayReply(context, {
      description: displayDetailsLine([
        translate('music_resume.resumed_at', {position: Markup.codestring(formatTime(resumed.position))}),
        translate('music_play.now_playing', {channel: channel.mention}),
      ]),
    });
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
    return displayReply(context, {
      description: displayDetailsLine([
        translate('music_resume.resumed_at', {position: Markup.codestring(formatTime(player.position))}),
        translate('music_play.now_playing', {channel: channel.mention}),
      ]),
    });
  }

  const player = (context.guildId) ? await VoiceNode.setPaused(context.guildId, false) : null;
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  return displayReply(context, {
    description: translate('music_resume.resumed_at', {position: Markup.codestring(formatTime(player.position))}),
  });
}

import { Command, Interaction, Structures } from 'detritus-client';
import { ComponentContext } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { displayDetails, displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getTranslator } from '../../i18n';

import { canControlMusic, musicDjRefusal } from './music.shared';


export const COMMAND_ID = 'music.tts.stop';

// `tts play`'s clips on the voice node are `tts-<user id>-<when>`, whose they are is read from the id
export const SPEECH_ID_PREFIX = 'tts-';

export function createSpeechId(userId: string): string {
  return `${SPEECH_ID_PREFIX}${userId}-${Date.now().toString(36)}`;
}

// why `member` can't stop the Text to Speech being said (`tts play` over the music, not one queued like a song: that's
// a track, `music skip`), null when they can. The node only stops all of it at once, so: whoever controls the music
// (djs, manage channel on our voice channel) from anywhere, everyone else from our channel when all of it is their own,
// or anyone's with dj mode off (other people's music, like removing their tracks)
export async function speechStopRefusal(
  context: ComponentContext | Command.Context | Interaction.InteractionContext,
  translate: Translator['translate'],
  guildId: string,
  member: null | Structures.Member | undefined,
): Promise<null | string> {
  const guild = VoiceNode.guilds.get(guildId);
  const ids = VoiceNode.speechIds(guildId, SPEECH_ID_PREFIX);
  if (!guild || !ids.length) {
    return translate('music_tts.nothing_saying');
  }
  if (canControlMusic(member)) {
    return null;
  }
  const voiceState = member && member.voiceState;
  if (!member || !voiceState || voiceState.channelId !== guild.channelId) {
    return translate('music_controls.join_my_channel', {channel: `<#${guild.channelId}>`});
  }
  const own = `${SPEECH_ID_PREFIX}${member.id}-`;
  if (ids.every((id) => id.startsWith(own))) {
    return null;
  }
  const refusal = musicDjRefusal(translate, member, await fetchGuildMusic(context, guildId).catch(() => null));
  return (refusal) ? displayDetails([translate('music_tts.others_too'), refusal]) : null;
}

// stops what `tts play` is saying and drops the ones waiting after it (their Stop buttons go as the clips end)
export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music_tts.nothing_saying')});
  }
  const refusal = await speechStopRefusal(context, translate, guildId, context.member);
  if (refusal) {
    return displayReply(context, {description: refusal});
  }
  // over by itself while the dj setting was fetched
  const stopped = await VoiceNode.stopSpeech(guildId, SPEECH_ID_PREFIX);
  return displayReply(context, {description: translate((stopped) ? 'music_tts.stopped' : 'music_tts.nothing_saying')});
}

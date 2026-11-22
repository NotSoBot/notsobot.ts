import { Command, Interaction } from 'detritus-client';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import * as MusicPlay from './music.play';


export const COMMAND_ID = 'music.tts';

// the voice node's `MAX_SPEAK_AUDIO` (its src/server/server.ts), a `speak` clip's base64 past it gets a 413
const MAX_SPEAK_AUDIO = 700 * 1024;

export interface CommandArgs {
  // queued like a song instead of said right away over the music
  queue?: boolean,
  text: string,
  use?: {voice: TTSVoices, voiceId?: string},
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // before making the speech (a cloned voice costs), `music play` says it again otherwise
  const { channel, error } = MusicPlay.findVoiceChannel(context);
  if (!channel) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate(error)});
  }

  // we're in their channel already: said right away like `.ai listen`'s replies, over the music (ducked under it) while
  // it plays, otherwise on its own. Not there yet, it's queued (that joins)
  // alone in another channel (only bots there) we come to theirs first, the move's done by the time the speech is made
  const guild = VoiceNode.guilds.get(channel.guildId);
  const here = !!guild && !guild.disconnected && (guild.channelId === channel.id || VoiceNode.moveFromEmpty(channel.guildId, channel.id));
  if (!args.queue && here) {
    const response = await funTextToSpeech(context, {
      text: args.text,
      voice: args.use && args.use.voice,
      voiceClip: true,
      voiceId: args.use && args.use.voiceId,
    });
    const { file } = response.items[0];
    if (!file.value) {
      throw new Error('Text to Speech wasn\'t made, try again');
    }
    // a couple of minutes of speech, too much to send the node at once. made already, so not made again to queue it
    // (a cloned voice costs per character)
    if (MAX_SPEAK_AUDIO < file.value.length) {
      const { translate } = await getTranslator(context);
      return displayReply(context, {description: translate('music_tts.too_long')});
    }
    // held while NotSoAI's answering in `.ai listen`, it's said right after the answer
    const spoken = await VoiceNode.speak(channel.guildId, `tts-${context.userId}-${Date.now().toString(36)}`, file.value);
    // we left (or got disconnected) while it was being made, it used to say it was being said
    if (spoken === 'dropped') {
      throw new Error('Left the voice channel before it could be said, try again');
    }
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate((spoken === 'held') ? 'music_tts.saying_after' : 'music_tts.saying')});
  }

  // hosted by us so it's queued like any other link to a file, temporary even for users whose uploads are permanent
  // (the queue converts its own copy)
  const response = await funTextToSpeech(context, {
    text: args.text,
    upload: true,
    uploadTemporary: true,
    voice: args.use && args.use.voice,
    voiceId: args.use && args.use.voiceId,
  });
  const { storage } = response.items[0];
  if (!storage) {
    throw new Error('Text to Speech wasn\'t uploaded, try again');
  }
  return MusicPlay.createMessage(context, {query: storage.urls.cdn});
}

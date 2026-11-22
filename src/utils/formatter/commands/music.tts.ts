import { Command, Interaction } from 'detritus-client';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import * as MusicPlay from './music.play';


export const COMMAND_ID = 'music.tts';

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
    // held while NotSoAI's answering in `.ai listen`, it's said right after the answer
    const spoken = await VoiceNode.speak(channel.guildId, `tts-${context.userId}-${Date.now().toString(36)}`, file.value);
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

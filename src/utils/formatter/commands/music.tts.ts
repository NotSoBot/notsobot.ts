import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components } from 'detritus-client/lib/utils';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { displayReply, renderEphemeralDisplay } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getCachedTranslator, getTranslator } from '../../i18n';

import * as MusicPlay from './music.play';
import { SPEECH_ID_PREFIX, createSpeechId, speechStopRefusal } from './music.tts.stop';


export const COMMAND_ID = 'music.tts';

// the voice node's `MAX_SPEAK_AUDIO` (its src/server/server.ts), a `speak` clip's base64 past it gets a 413
const MAX_SPEAK_AUDIO = 700 * 1024;
// how long the Stop button stays when the clip's end never reaches us (we left with it held, a node failover): the
// longest clip the node says (its `SPEECH_MAX`, a minute) after the longest it's held for NotSoAI's answer (the voice
// node client's `SPEECH_HOLD_MAX`, a minute), and a little more
const STOP_BUTTON_TIME = 135 * 1000;

// the reply's Stop button
//   posting   the clip went to the node, the reply with the button isn't up yet
//   up        it can be pressed
//   stopping  a press is stopping the speech (other presses are only acknowledged)
//   gone      the clip's over (said, stopped, or nobody told us and the button timed out), never pressed again
// posting → up → stopping → gone, posting → gone and up → gone (the clip ended), stopping → up (the stop failed)
type StopButtonState = 'gone' | 'posting' | 'stopping' | 'up';

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
    const { translate } = await getTranslator(context);
    const guildId = channel.guildId;
    const id = createSpeechId(context.userId);

    // the reply has a Stop button while the clip isn't over (`tts stop` does the same): whoever's it is, or whoever
    // controls the music (`speechStopRefusal`). Listened for before it's sent, a clip the node can't play ends right away
    const stop: {description: string, ended: boolean, state: StopButtonState} = {description: '', ended: false, state: 'posting'};
    const removeButton = () => displayReply(context, {description: stop.description}).catch(() => {});
    const unlisten = VoiceNode.onSpeechEnd(id, () => {
      stop.ended = true;
      if (stop.state === 'up') {
        stop.state = 'gone';
        removeButton();
      }
    });

    let spoken: 'dropped' | 'held' | 'sent';
    try {
      // held while NotSoAI's answering in `.ai listen`, it's said right after the answer
      spoken = await VoiceNode.speak(guildId, id, file.value);
    } catch(error) {
      unlisten();
      throw error;
    }
    // we left (or got disconnected) while it was being made, it used to say it was being said
    if (spoken === 'dropped') {
      unlisten();
      throw new Error('Left the voice channel before it could be said, try again');
    }
    stop.description = translate((spoken === 'held') ? 'music_tts.saying_after' : 'music_tts.saying');

    const components = new Components({
      timeout: STOP_BUTTON_TIME,
      onTimeout: () => {
        if (stop.state === 'up') {
          stop.state = 'gone';
          unlisten();
          removeButton();
        }
      },
    });
    components.createButton({
      label: translate('common.stop'),
      style: MessageComponentButtonStyles.SECONDARY,
      run: async (ctx: ComponentContext) => {
        if (stop.state !== 'up') {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }
        await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        // this clip's over and nobody told us (the voice node client was reloaded): the button just goes
        if (!VoiceNode.speechIds(guildId, SPEECH_ID_PREFIX).includes(id)) {
          if (stop.state === 'up') {
            stop.state = 'gone';
            unlisten();
            await displayReply(context, {description: stop.description}, {replyTo: ctx});
          }
          return;
        }
        // in their own language, only they see it
        const translator = getCachedTranslator(ctx);
        const refusal = await speechStopRefusal(ctx, translator.translate, guildId, ctx.member);
        if (refusal) {
          return ctx.createMessage(renderEphemeralDisplay(ctx, translator, {description: refusal}));
        }
        // it ended (or another press got here first) while the dj setting was fetched
        if (stop.state !== 'up') {
          return;
        }
        stop.state = 'stopping';
        try {
          await VoiceNode.stopSpeech(guildId, SPEECH_ID_PREFIX);
        } catch(error) {
          // the node couldn't be asked: still being said, unless it ended meanwhile
          stop.state = (stop.ended) ? 'gone' : 'up';
          if (stop.ended) {
            removeButton();
          }
          throw error;
        }
        stop.state = 'gone';
        unlisten();
        await displayReply(context, {description: translate('music_tts.stopped')}, {replyTo: ctx});
      },
    });

    // over before the reply was up (the node couldn't play it): no button
    if (stop.ended) {
      stop.state = 'gone';
      return displayReply(context, {description: stop.description});
    }
    const reply = await displayReply(context, {components, componentsInside: true, description: stop.description});
    if (stop.ended) {
      stop.state = 'gone';
      await removeButton();
    } else {
      stop.state = 'up';
    }
    return reply;
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

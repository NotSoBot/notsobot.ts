import { Command, GatewayClientEvents, Structures } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { EventSubscription } from 'detritus-utils';

import { mediaAVToolsTranscribe } from '../../../api';
import { getApiError } from '../../../api/errors';
import { StatusEmojis } from '../../../constants';
import { log } from '../../../log';
import { displayReply, formatTime } from '../../../utils';
import { addExtraResponse, detachReply } from '../../commandresponses';
import VoiceNode, { ListenEndReason, VoiceListenError } from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { findVoiceChannel } from './music.play';
import { canControlMusic } from './music.shared';
import * as TagGenerate from './tag.generate';


// Talking to NotSoAI in voice: the node sends each thing they say once they stop (`listen` with `utterances`), it's
// transcribed (vad on, so their silence or the music isn't turned into words), answered like a message (a new reply each
// time, one conversation for the whole session) and its spoken sentences are said back in their Default TTS Voice as
// they're written, over the music if it's playing (ducked under it). Owner only until it's released, so its text isn't
// translated yet
export const COMMAND_ID = 'ai.listen';

// how long a session listens, `ai listen stop` (or us leaving the channel) ends it sooner
const LISTEN_DURATION = 10 * 60 * 1000;
// what's shown of what was heard
const HEARD_MAX_LENGTH = 300;
// its spoken sentences' ids start with this (`VoiceNode.isSpeaking`)
const SPEECH_ID_PREFIX = 'ai-';

export interface CommandArgs {
  // what came after `ai listen`: nothing starts it, `stop` stops it, anything else was a prompt for NotSoAI
  text?: string,
}

interface Session {
  busy: boolean,
  ended: null | ListenEndReason,
  // the last turn's NotSoAI response, the next one continues it
  parentId: null | string,
  // said while a turn was being answered, the newest one goes next (older ones are dropped)
  pending: null | Buffer,
  speeches: number,
  // `{ai.listen.stop}` asked the node to stop, its answer plays out but nothing else is answered
  stopping: boolean,
  // the command message's deletes, it ends the session (its replies go with it)
  subscriptions: Array<EventSubscription>,
  // who it's listening to
  userId: string,
}

// by guild, one at a time (the node listens to one thing per guild)
const sessions = new Map<string, Session>();

export async function createMessage(context: Command.Context, args: CommandArgs) {
  const text = (args.text || '').trim();
  // not the owner (it isn't released yet), or more after `listen`: it was something to ask NotSoAI
  if (!context.user.isClientOwner || (text && text.toLowerCase() !== 'stop')) {
    return TagGenerate.createMessage(context, {prompt: ['listen', text].filter(Boolean).join(' ')});
  }

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} Talk to NotSoAI in a server's voice channel`});
  }

  if (text) {
    const session = sessions.get(guildId);
    if (!session) {
      return displayReply(context, {description: 'NotSoAI isn\'t listening here'});
    }
    stopSession(guildId, session);
    return displayReply(context, {description: 'NotSoAI stopped listening'});
  }

  const { channel, error } = findVoiceChannel(context);
  if (!channel) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate(error)});
  }

  const session: Session = {busy: false, ended: null, parentId: null, pending: null, speeches: 0, stopping: false, subscriptions: [], userId: context.userId};
  try {
    await VoiceNode.listen(context.client, guildId, channel.id, context.userId, LISTEN_DURATION, {
      onEnd: (reason) => {
        session.ended = reason;
        session.pending = null;
        unsubscribe(session);
        if (sessions.get(guildId) === session) {
          sessions.delete(guildId);
        }
      },
      onUtterance: (audio) => onUtterance(context, guildId, session, audio),
    }, {utterances: true});
  } catch(error) {
    const { translate } = await getTranslator(context);
    let description: string;
    if (error instanceof VoiceListenError) {
      description = (error.reason === 'busy') ?
        translate('music_listen.busy') :
        translate('music_listen.other_channel', {channel: (error.channelId) ? `<#${error.channelId}>` : translate('common.channel')});
    } else {
      const apiError = await getApiError(error);
      description = (apiError) ? apiError.message : String(error.message || error);
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`});
  }
  // it ended before it started (the node couldn't)
  if (session.ended !== null) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} NotSoAI couldn't start listening (${session.ended}), try again`});
  }
  sessions.set(guildId, session);
  const onDeleted = (channelId: string, messageIds: Array<string>) => {
    if (channelId === context.channelId && messageIds.includes(context.messageId)) {
      stopSession(guildId, session);
    }
  };
  session.subscriptions.push(
    context.client.subscribe(ClientEvents.MESSAGE_DELETE, (event: GatewayClientEvents.MessageDelete) => {
      onDeleted(event.channelId, [event.messageId]);
    }),
    context.client.subscribe(ClientEvents.MESSAGE_DELETE_BULK, (event: GatewayClientEvents.MessageDeleteBulk) => {
      onDeleted(event.channelId, Array.from(event.messages.keys()));
    }),
  );
  // deleted while the node was starting it, before the events above were watched (nothing to reply to)
  if (context.message.deleted) {
    stopSession(guildId, session);
    return;
  }

  return displayReply(context, {
    description: `NotSoAI is listening to ${context.user.mention} in <#${channel.id}> for ${formatTime(LISTEN_DURATION)}, talk to it`,
    note: `${Markup.codestring(`${context.prefix}ai listen stop`)} to stop`,
  });
}

// `ai listen stop`, or the command message that started it got deleted. the node ends it (`onEnd`)
function stopSession(guildId: string, session: Session): void {
  unsubscribe(session);
  if (session.ended !== null || sessions.get(guildId) !== session) {
    return;
  }
  VoiceNode.stopListening(guildId);
  VoiceNode.stopSpeaking(guildId).catch((error) => log.warn(`ai listen stop speaking ${guildId}`, error));
}

// `{ai.listen.stop}`: NotSoAI ending the conversation (they said goodbye or asked it to stop listening). Only listening
// stops, the answer it's giving still plays out (`ai listen stop` cuts it off). Whoever it's listening to, or a dj
export function stopListeningFor(
  guildId: string,
  member: null | Structures.Member | undefined,
): 'not_allowed' | 'not_listening' | 'stopped' {
  const session = sessions.get(guildId);
  if (!session || session.ended !== null || session.stopping) {
    return 'not_listening';
  }
  if (!member || (member.id !== session.userId && !canControlMusic(member))) {
    return 'not_allowed';
  }
  session.stopping = true;
  session.pending = null;
  unsubscribe(session);
  VoiceNode.stopListening(guildId);
  return 'stopped';
}

function unsubscribe(session: Session): void {
  for (let subscription of session.subscriptions) {
    subscription.remove();
  }
  session.subscriptions = [];
}

function onUtterance(context: Command.Context, guildId: string, session: Session, audio: Buffer) {
  if (session.ended !== null || session.stopping) {
    return;
  }
  if (session.busy) {
    session.pending = audio;
    return;
  }
  runTurn(context, guildId, session, audio).catch((error) => log.warn(`ai listen ${guildId}`, error));
}

async function runTurn(context: Command.Context, guildId: string, session: Session, audio: Buffer) {
  session.busy = true;
  try {
    const transcription = await mediaAVToolsTranscribe(context, {
      file: {filename: 'speech.ogg', value: audio},
      vad: true,
    });
    const prompt = transcription.text.trim();
    if (!prompt || session.ended !== null || session.stopping) {
      return;
    }
    // they talked over it: what it was still saying stops, like a person would ("be quiet" needs nothing more). Only
    // while its own sentences are playing, `tts play` alone isn't interrupted (one queued behind them goes with them)
    if (VoiceNode.isSpeaking(guildId, SPEECH_ID_PREFIX)) {
      await VoiceNode.stopSpeaking(guildId).catch((error) => log.warn(`ai listen interrupt ${guildId}`, error));
    }
    log.debug(`ai listen ${guildId} heard ${prompt.length} characters`);
    const turn: TagGenerate.AIVoiceTurn = {
      heard: prompt.slice(0, HEARD_MAX_LENGTH),
      onSpeech: (speech) => {
        if (speech && session.ended === null) {
          const id = `${SPEECH_ID_PREFIX}${Date.now().toString(36)}-${++session.speeches}`;
          VoiceNode.speak(guildId, id, speech, {turn: true}).catch((error) => log.warn(`ai listen speak ${guildId}`, error));
        }
      },
      parentId: session.parentId,
    };
    await TagGenerate.createVoiceMessage(context, prompt.slice(0, 2000), turn);
    // grouped with the command now, detritus forgets it once the next turn replies (or after its edit window)
    if (context.response) {
      addExtraResponse(context, context.response);
    }
    if (turn.responseId) {
      session.parentId = turn.responseId;
    }
  } catch(error) {
    const apiError = await getApiError(error);
    const description = (apiError) ? apiError.message : String(error.message || error);
    // its own reply, the listening one stays as it is
    detachReply(context);
    const reply = await displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`}).catch(() => null);
    if (reply) {
      addExtraResponse(context, reply);
    }
  } finally {
    // its sentences have all been sent, speech held for them (`tts play`) goes after them
    VoiceNode.endSpeechTurn(guildId);
    session.busy = false;
    const next = session.pending;
    session.pending = null;
    if (next && session.ended === null && !session.stopping) {
      runTurn(context, guildId, session, next).catch((error) => log.warn(`ai listen ${guildId}`, error));
    }
  }
}

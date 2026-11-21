import { Command } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { mediaAVToolsTranscribe } from '../../../api';
import { getApiError } from '../../../api/errors';
import { StatusEmojis } from '../../../constants';
import { log } from '../../../log';
import { displayReply, formatTime } from '../../../utils';
import VoiceNode, { ListenEndReason, VoiceListenError } from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { findVoiceChannel } from './music.play';
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
    VoiceNode.stopListening(guildId);
    VoiceNode.stopSpeaking(guildId).catch((error) => log.warn(`ai listen stop speaking ${guildId}`, error));
    return displayReply(context, {description: 'NotSoAI stopped listening'});
  }

  const { channel, error } = findVoiceChannel(context);
  if (!channel) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate(error)});
  }

  const session: Session = {busy: false, ended: null, parentId: null, pending: null, speeches: 0};
  try {
    await VoiceNode.listen(context.client, guildId, channel.id, context.userId, LISTEN_DURATION, {
      onEnd: (reason) => {
        session.ended = reason;
        session.pending = null;
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
  if (session.ended === null) {
    sessions.set(guildId, session);
  }

  return displayReply(context, {
    description: `NotSoAI is listening to ${context.user.mention} in <#${channel.id}> for ${formatTime(LISTEN_DURATION)}, talk to it`,
    note: `${Markup.codestring(`${context.prefix}ai listen stop`)} to stop`,
  });
}

function onUtterance(context: Command.Context, guildId: string, session: Session, audio: Buffer) {
  if (session.ended !== null) {
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
    if (!prompt || session.ended !== null) {
      return;
    }
    log.debug(`ai listen ${guildId} heard ${prompt.length} characters`);
    const turn: TagGenerate.AIVoiceTurn = {
      heard: prompt.slice(0, HEARD_MAX_LENGTH),
      onSpeech: (speech) => {
        if (speech && session.ended === null) {
          const id = `ai-${Date.now().toString(36)}-${++session.speeches}`;
          VoiceNode.speak(guildId, id, speech).catch((error) => log.warn(`ai listen speak ${guildId}`, error));
        }
      },
      parentId: session.parentId,
    };
    await TagGenerate.createVoiceMessage(context, prompt.slice(0, 2000), turn);
    if (turn.responseId) {
      session.parentId = turn.responseId;
    }
  } catch(error) {
    const apiError = await getApiError(error);
    const description = (apiError) ? apiError.message : String(error.message || error);
    // its own reply, the listening one stays as it is
    context.commandClient.replies.delete(context.messageId);
    await displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`}).catch(() => {});
  } finally {
    session.busy = false;
    const next = session.pending;
    session.pending = null;
    if (next && session.ended === null) {
      runTurn(context, guildId, session, next).catch((error) => log.warn(`ai listen ${guildId}`, error));
    }
  }
}

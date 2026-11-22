import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic, mediaAVToolsIdentify } from '../../../api';
import { getApiError } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { log } from '../../../log';
import { displayReply, formatTime } from '../../../utils';
import { memberOrUser } from '../../parameters';
import VoiceNode, { ListenEndReason, VoiceListenError } from '../../../voicenode';
import { Languages, getTranslator, getTranslatorForLanguage, languageFromLocale } from '../../i18n';

import { replySongs } from './media.av.tools.identify';
import { createMessage as replyMusicInfo } from './music.info';
import { findVoiceChannel } from './music.play';
import { musicItemTitle, musicNothingPlayingText } from './music.shared';


export const COMMAND_ID = 'music.listen';
// what the cooldown message calls it
const COMMAND_NAME = 'music listen';

// like a phone's song finder: up to this long, done as soon as a song's found (the node sends the last ~12 seconds every
// ~5 seconds of new audio, each one's asked about until one's found)
const LISTEN_DURATION = 2 * 60 * 1000;
// the stop button outlives the listen a little (the node's last snapshot, the api's last answer)
const STOP_BUTTON_PADDING = 30 * 1000;
// someone can start another listen this long after their last one ended (a listen asks the api up to ~23 times). Kept
// here, not as the commands' ratelimits, so `/music listen` and `.music listen` share it (their clients keep their own)
const LISTEN_COOLDOWN = 2 * 1000;
// by user id, when they can listen again (this cluster's, where the server's music is). While one runs it's when it
// would end at the latest plus the cooldown, so they can't start one in another server meanwhile
const cooldowns = new Map<string, number>();

function setCooldown(userId: string, until: number) {
  const now = Date.now();
  if (1000 <= cooldowns.size) {
    for (const [id, expires] of cooldowns) {
      if (expires <= now) {
        cooldowns.delete(id);
      }
    }
  }
  cooldowns.set(userId, until);
}

// for telling a match apart from the track we're playing ourselves (someone's speakers into their mic): lowercase, no
// `(feat. ...)`/`[Remastered]`, letters and numbers only
function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[([{].*?[)\]}]/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
}

// the track the server's music is playing, a match on it is our own music coming back through someone's mic
function isPlayingTrack(
  song: RestResponsesRaw.MediaAVToolsIdentifySong,
  current: null | RestResponsesRaw.GuildMusicQueueItem,
): boolean {
  const track = current && current.track;
  if (!track) {
    return false;
  }
  if (track.isrc && song.ids && song.ids.isrc && track.isrc === song.ids.isrc) {
    return true;
  }
  const title = normalizeTitle(track.title);
  return !!title && title === normalizeTitle(song.title);
}

// who to listen to: someone (a member or user found from the text), everyone mixed, or null when nobody was found. Left
// out, it's everyone
export type ListenTarget = 'everyone' | Structures.Member | Structures.User;

export interface CommandArgs {
  target?: ListenTarget | null,
}

// `everyone`, `all`, `@everyone` and the word in their language pick everyone, anything else is looked up as a member
export async function parseTarget(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<ListenTarget | null | undefined> {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  const { translate } = await getTranslator(context);
  if (['everyone', 'all', '@everyone', translate('music_listen.everyone').toLowerCase()].includes(text)) {
    return 'everyone';
  }
  return memberOrUser()(value, context);
}

// who's in their voice channel (but us) to pick from, everyone first
export async function autocompleteTarget(context: Interaction.InteractionAutoCompleteContext) {
  const { translate } = getTranslatorForLanguage(languageFromLocale(context.locale) || Languages.ENGLISH);
  const value = (context.value || '').toLowerCase();
  const everyone = translate('music_listen.everyone');
  const choices: Array<{name: string, value: string}> = [];
  if (!value || everyone.toLowerCase().startsWith(value) || 'everyone'.startsWith(value)) {
    choices.push({name: everyone, value: 'everyone'});
  }
  const channel = context.member && context.member.voiceState && context.member.voiceState.channel;
  if (channel) {
    for (const [, state] of channel.voiceStates) {
      const member = state.member || context.guild?.members.get(state.userId);
      const name = (member) ? member.name : state.userId;
      if (value && !name.toLowerCase().includes(value) && !(member && member.username.toLowerCase().includes(value))) {
        continue;
      }
      choices.push({name: name.slice(0, 100), value: state.userId});
      if (25 <= choices.length) {
        break;
      }
    }
  }
  return context.respond({choices});
}

// us as the target: we know what we're playing. A track (opus.rip) is shown like `music info`, a link or file's song is
// identified from where it's at (a mix's current song), one request so no listening and no cooldown
async function replyPlaying(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId;
  const music = (guildId) ? await fetchGuildMusic(context, guildId).catch(() => null) : null;
  const current = (music) ? music.current : null;
  if (!guildId || !current) {
    return displayReply(context, {description: musicNothingPlayingText(translate, guildId)});
  }
  if (current.source === 'opus') {
    return replyMusicInfo(context);
  }
  const url = (current.track && current.track.url) || current.url;
  const player = (VoiceNode.guilds.has(guildId)) ? await VoiceNode.getPlayer(guildId).catch(() => null) : null;
  // the node's position is the file's own time (whatever the speed), a held track's is where it stopped
  const position = (player) ? player.position : (music!.held_position || 0);
  const songs = await mediaAVToolsIdentify(context, {start: Math.max(Math.round(position), 0), url});
  // `file.mp3 • 1:23`, what was identified and from where
  const note = `${musicItemTitle(current)} • ${Markup.codestring(formatTime(position))}`;
  if (songs.length) {
    return replySongs(context, translate, songs, {note});
  }
  return displayReply(context, {description: translate('media.identify.not_found'), note});
}

export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs = {}) {
  const { language, translate } = await getTranslator(context);

  if (args.target && args.target !== 'everyone' && args.target.id === context.client.userId) {
    return replyPlaying(context);
  }

  const userId = context.userId;
  const cooldown = (cooldowns.get(userId) || 0) - Date.now();
  if (0 < cooldown) {
    const seconds = (cooldown / 1000).toLocaleString(language, {maximumFractionDigits: 1, minimumFractionDigits: 1});
    return displayReply(context, {
      description: `${StatusEmojis.WARNING} ${translate('ratelimit.command.user', {command: Markup.codestring(COMMAND_NAME), seconds})}`,
      ephemeral: true,
    });
  }

  const { channel, error } = findVoiceChannel(context);
  if (!channel) {
    return displayReply(context, {description: translate(error)});
  }
  const guildId = channel.guildId;

  // who: everyone mixed together (left out), or someone in their channel (themselves, a person playing a song, another
  // bot's music). Discord doesn't send us our own audio
  let targetId: null | string = null;
  // no one person was picked: it says everyone in the channel, even when it ends up hearing the one person there
  const everyone = args.target === undefined || args.target === 'everyone';
  if (!everyone) {
    const target = args.target as null | Structures.Member | Structures.User;
    const inChannel = !!target && target.id !== context.client.userId &&
      channel.voiceStates.some((state) => state.userId === target.id);
    if (!target || !inChannel) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_listen.target_missing')}`});
    }
    targetId = target.id;
  }
  // everyone, but they're alone in there (besides us): nothing to mix, their own audio as it is (never decoded). Someone
  // joining after this isn't heard
  if (targetId === null) {
    const people: Array<string> = [];
    for (const [, state] of channel.voiceStates) {
      if (state.userId !== context.client.userId) {
        people.push(state.userId);
      }
    }
    if (people.length === 1) {
      targetId = people[0];
    }
  }

  // said before anything's sent (the listen itself starts after the reply, joining can take a while)
  if (VoiceNode.isListening(guildId)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_listen.busy')}`});
  }
  const playing = VoiceNode.guilds.get(guildId);
  // in another channel with only bots there, `VoiceNode.listen` moves us
  if (playing && (playing.disconnected || (playing.channelId !== channel.id && !VoiceNode.canMoveFromEmpty(guildId, channel.id)))) {
    const elsewhere = (playing.channelId) ? `<#${playing.channelId}>` : translate('common.channel');
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_listen.other_channel', {channel: elsewhere})}`});
  }

  // only one identification at a time, a newer snapshot replaces one that's waiting (it has the older one's audio too)
  let found = false;
  let identifying = false;
  let ended: null | ListenEndReason = null;
  let finished = false;
  let waiting: null | Buffer = null;
  // what went wrong the last time the api was asked (said if nothing was ever identified)
  let lastError: null | string = null;
  let heard = 0;

  const finish = async () => {
    if (finished || found || identifying || ended === null) {
      return;
    }
    finished = true;
    setCooldown(userId, Date.now() + LISTEN_COOLDOWN);
    components.clear();
    let description: string;
    if (ended === 'left' || ended === 'voice' || ended === 'destroyed') {
      description = translate('music_listen.left');
    } else if (ended === 'stopped') {
      description = translate('music_listen.stopped');
    } else if (ended === 'failed') {
      description = `${StatusEmojis.WARNING} ${translate('music_listen.stopped')}`;
    } else if (!heard) {
      if (everyone) {
        description = translate('music_listen.heard_nothing_everyone');
      } else if (targetId === context.userId) {
        description = translate('music_listen.heard_nothing');
      } else {
        description = translate('music_listen.heard_nothing_user', {user: `<@${targetId}>`});
      }
    } else if (lastError) {
      description = `${StatusEmojis.WARNING} ${lastError}`;
    } else {
      description = translate('music_listen.not_found', {duration: formatTime(LISTEN_DURATION)});
    }
    try {
      await displayReply(context, {description, note: (heard && ended !== 'stopped') ? translate('music_listen.noise_tip') : null});
    } catch(error) {
      // the reply's gone (deleted, or too old to edit)
    }
  };

  const identify = async () => {
    if (identifying || found || !waiting) {
      return;
    }
    identifying = true;
    const audio = waiting;
    waiting = null;
    try {
      const songs = await mediaAVToolsIdentify(context, {file: {contentType: 'audio/ogg', filename: 'listen.ogg', value: audio}});
      lastError = null;
      if (songs.length && !found) {
        // our own music coming back through their mic isn't what they're asking about
        const music = await fetchGuildMusic(context, guildId).catch(() => null);
        const heardSongs = songs.filter((song) => !isPlayingTrack(song, (music) ? music.current : null));
        if (heardSongs.length && !found) {
          found = true;
          setCooldown(userId, Date.now() + LISTEN_COOLDOWN);
          VoiceNode.stopListening(guildId);
          components.clear();
          await replySongs(context, translate, heardSongs);
        }
      }
    } catch(error) {
      const apiError = await getApiError(error);
      lastError = (apiError) ? apiError.message : String(error.message || error);
      log.warn(`music listen identify ${guildId}`, error);
    } finally {
      identifying = false;
    }
    if (!found && waiting) {
      return identify();
    }
    return finish();
  };

  const components = new Components({timeout: LISTEN_DURATION + STOP_BUTTON_PADDING});
  components.createButton({
    label: translate('music_listen.stop'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      if (ctx.userId === context.userId && !found && ended === null) {
        VoiceNode.stopListening(guildId);
      }
    },
  });

  const duration = formatTime(LISTEN_DURATION);
  let listeningText: string;
  if (everyone) {
    listeningText = translate('music_listen.listening_everyone', {channel: `<#${channel.id}>`, duration});
  } else if (targetId === context.userId) {
    listeningText = translate('music_listen.listening', {duration, user: context.user.mention});
  } else {
    listeningText = translate('music_listen.listening_user', {duration, user: `<@${targetId}>`});
  }

  // held until it ends (then `LISTEN_COOLDOWN` from then), cleared if it never starts
  setCooldown(userId, Date.now() + LISTEN_DURATION + STOP_BUTTON_PADDING + LISTEN_COOLDOWN);

  try {
    await displayReply(context, {
      components,
      componentsInside: true,
      description: listeningText,
      note: translate('music_listen.noise_tip'),
    });
  } catch(error) {
    cooldowns.delete(userId);
    throw error;
  }

  try {
    await VoiceNode.listen(context.client, guildId, channel.id, targetId, LISTEN_DURATION, {
      onAudio: (audio, heardSoFar) => {
        heard = heardSoFar;
        waiting = audio;
        identify().catch((error) => log.warn(`music listen ${guildId}`, error));
      },
      onEnd: (reason) => {
        ended = reason;
        finish().catch((error) => log.warn(`music listen ${guildId}`, error));
      },
    });
  } catch(error) {
    // nothing was listened to
    cooldowns.delete(userId);
    components.clear();
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
}

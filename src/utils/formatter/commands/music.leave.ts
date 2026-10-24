import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components } from 'detritus-client/lib/utils';

import { deleteGuildMusic, fetchGuildMusic } from '../../../api';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.leave';

// how long the clear/keep buttons work
const CONFIRM_TIMEOUT = 60 * 1000;

// stops the music and leaves. With anything playing or queued it asks first: clear the queue, or keep it (the playing
// track's held, the next `music play` carries on from there). Unanswered, the buttons go after a minute and nothing
// changes. Held music (paused too long, we left already) is cleared or kept as it is
export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { language, translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  // the voice node's channel, or one we're still in without it knowing (like after the node lost our players)
  const me = context.guild && context.guild.me;
  const channelId = VoiceNode.guilds.get(guildId)?.channelId || (me && me.voiceState && me.voiceState.channelId);
  const music = await fetchGuildMusic(context, guildId).catch(() => null);
  const held = !channelId && !!music && music.held_position !== null;
  if (!channelId && !held) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const channel = `<#${channelId}>`;

  // leaves (if we're still in a channel) and empties the api's queue, its session goes with it
  const leaveAndClear = async () => {
    if (VoiceNode.guilds.has(guildId)) {
      VoiceNode.leave(guildId, true);
    } else {
      if (channelId) {
        context.client.gateway.voiceStateUpdate(guildId, null);
      }
      await deleteGuildMusic(context, guildId);
    }
  };

  // what's playing (or held) counts, keeping it holds it to carry on first. Only with nothing at all it just leaves, the
  // api not answering asks anyway (it's not known to be empty, clearing it unasked could lose the queue)
  const count = (music) ? music.queue.length + ((music.current) ? 1 : 0) : null;
  if (count === 0) {
    await leaveAndClear();
    return displayReply(context, {description: translate('music_leave.left_channel', {channel})});
  }

  let description: string;
  if (count === null) {
    description = translate('music_leave.confirm_unknown', {channel});
  } else if (held) {
    description = translate('music_leave.confirm_held', {count: count.toLocaleString(language)});
  } else {
    description = translate('music_leave.confirm', {channel, count: count.toLocaleString(language)});
  }

  // once a button's used the timeout leaves the message alone
  let done = false;
  const components = new Components({
    timeout: CONFIRM_TIMEOUT,
    onTimeout: async () => {
      if (done) {
        return;
      }
      try {
        // the buttons go, nothing changed
        await displayReply(context, {description});
      } catch(error) {

      }
    },
  });

  // only whoever used the command, the others' presses are ignored
  const claim = async (ctx: ComponentContext): Promise<boolean> => {
    if (ctx.userId !== context.userId || done) {
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      return false;
    }
    done = true;
    return true;
  };

  components.createButton({
    label: translate('music_leave.clear'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (!await claim(ctx)) {
        return;
      }
      await leaveAndClear();
      const text = (held) ? translate('music_leave.cleared') : translate('music_leave.left_channel', {channel});
      await displayReply(context, {description: text}, {replyTo: ctx});
    },
  });
  components.createButton({
    label: translate('music_leave.keep'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (!await claim(ctx)) {
        return;
      }
      // held already (we left), it just stays
      if (held) {
        return displayReply(context, {description: translate('music_leave.kept')}, {replyTo: ctx});
      }
      // the playing track's held where it is, a channel the node didn't know about has nothing to hold
      if (VoiceNode.guilds.has(guildId)) {
        VoiceNode.hold(guildId);
      } else {
        context.client.gateway.voiceStateUpdate(guildId, null);
      }
      await displayReply(context, {description: translate('music_leave.left_kept', {channel})}, {replyTo: ctx});
    },
  });

  return displayReply(context, {components, componentsInside: true, description});
}

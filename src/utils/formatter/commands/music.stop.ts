import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components } from 'detritus-client/lib/utils';

import { deleteGuildMusicQueue, editGuildMusic, fetchGuildMusic } from '../../../api';
import { MusicLoopModes } from '../../../constants';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Confirmer } from '../../confirmer';
import { getTranslator } from '../../i18n';

import { MusicVoteKinds, canControlMusic, clearMusicVotes, musicDjRefusal } from './music.shared';


export const COMMAND_ID = 'music.stop';

// how long the clear/keep buttons work
const CONFIRM_TIMEOUT = 60 * 1000;

// `music leave` without leaving: the music stops and we stay in the voice channel. It asks first like leaving does,
// clear the queue or keep it. Cleared, the playing track ends with nothing after it, so we're idle in the channel like
// when a queue runs out (leaving after a couple of minutes with nothing played, 24/7 stays). Kept, staying in the channel
// with the track held where it is is a pause, `music resume` carries on. Unanswered, the buttons go after a minute and
// nothing changes. Who can is `music leave`'s: with dj mode on only djs, off anyone in our channel
export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { language, translate } = await getTranslator(context);

  const guildId = context.guildId;
  const guild = (guildId) ? VoiceNode.guilds.get(guildId) : undefined;
  // playing or paused (a link still converting too). Idle in the channel there's nothing to stop, and music held after
  // we left is `music leave`'s to clear
  if (!guildId || !guild || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const channelId = guild.channelId;

  const music = await fetchGuildMusic(context, guildId);
  const refusal = musicDjRefusal(translate, context.member, music);
  if (refusal) {
    return displayReply(context, {description: refusal});
  }
  if (!canControlMusic(context.member)) {
    const voiceState = context.member && context.member.voiceState;
    if (!voiceState || voiceState.channelId !== channelId) {
      return displayReply(context, {description: translate('music_controls.join_my_channel', {channel: `<#${channelId}>`})});
    }
  }

  // nothing's left for the node to play next, then the playing track is skipped: it asks for the next one, there's
  // none, and the queue ends like it does by itself (idle in the channel, the session kept). The loop goes off first,
  // the queue loop would put the skipped track back at the end and play it again
  const stopAndClear = async () => {
    await editGuildMusic(context, guildId, {loop: MusicLoopModes.OFF});
    await deleteGuildMusicQueue(context, guildId);
    // the api's playing item as it is now, not the one from before the buttons: near a track's end it's the next one
    // already (the node committed it), the node stops both for that id. Without one it stops whatever's going out
    const now = await fetchGuildMusic(context, guildId).catch(() => null);
    // false when the track ended by itself meanwhile (the queue ended with it), stopped all the same
    await VoiceNode.skip(guildId, (now && now.current) ? now.current.id : undefined);
  };

  // what's playing counts. Nothing at all (the api's queue emptied under a track still going out) just stops
  const count = music.queue.length + ((music.current) ? 1 : 0);
  if (count === 0) {
    await stopAndClear();
    return displayReply(context, {description: translate('music_stop.stopped')});
  }

  const description = translate('music_stop.confirm', {count: count.toLocaleString(language)});

  // once a button's used the timeout leaves the message alone
  const confirmer = new Confirmer(context);
  const components = new Components({
    timeout: CONFIRM_TIMEOUT,
    onTimeout: () => confirmer.expire(async () => {
      try {
        // the buttons go, nothing changed
        await displayReply(context, {description});
      } catch(error) {

      }
    }),
  });

  // only whoever used the command, the others' presses are ignored
  components.createButton({
    label: translate('music_leave.clear'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return confirmer.run(ctx, async () => {
        await stopAndClear();
        await displayReply(context, {description: translate('music_stop.stopped')}, {replyTo: ctx});
      });
    },
  });
  components.createButton({
    label: translate('music_leave.keep'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return confirmer.run(ctx, async () => {
        // paused already stays paused. Nothing's playing anymore (it ended, or we left) while the buttons were up
        const player = await VoiceNode.setPaused(guildId, true);
        if (!player) {
          return displayReply(context, {description: translate('music.nothing_playing')}, {replyTo: ctx});
        }
        clearMusicVotes(MusicVoteKinds.RESUME, guildId);
        await displayReply(context, {description: translate('music_stop.kept')}, {replyTo: ctx});
      });
    },
  });

  return displayReply(context, {components, componentsInside: true, description});
}

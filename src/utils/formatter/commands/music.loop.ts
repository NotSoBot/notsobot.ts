import { Command, Interaction } from 'detritus-client';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { MusicLoopModes } from '../../../constants';
import { displayDetailsLine, displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { musicItemTitle } from './music.shared';


export const COMMAND_ID = 'music.loop';

// nothing given goes to the next one: off, the track, the queue, then off again
const NEXT_LOOP_MODE: Record<MusicLoopModes, MusicLoopModes> = {
  [MusicLoopModes.OFF]: MusicLoopModes.TRACK,
  [MusicLoopModes.TRACK]: MusicLoopModes.QUEUE,
  [MusicLoopModes.QUEUE]: MusicLoopModes.OFF,
};

export interface CommandArgs {
  mode?: MusicLoopModes | null,
}

export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  // the loop goes back to off when the bot leaves, so it's only for what's playing now
  const guildId = context.guildId;
  if (!guildId || !VoiceNode.guilds.has(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  let loop = args.mode;
  if (!loop) {
    const music = await fetchGuildMusic(context, guildId);
    loop = NEXT_LOOP_MODE[music.loop] || MusicLoopModes.TRACK;
  }
  const music = await editGuildMusic(context, guildId, {loop});

  let description: string;
  switch (music.loop) {
    case MusicLoopModes.TRACK: {
      description = displayDetailsLine([
        translate('music_loop.track'),
        (music.current) ? `**${musicItemTitle(music.current)}**` : null,
      ]);
    }; break;
    case MusicLoopModes.QUEUE: {
      // what's playing goes back into the queue too
      const count = music.queue.length + ((music.current) ? 1 : 0);
      description = displayDetailsLine([
        translate('music_loop.queue'),
        translate('music_queue.queued', {count: count.toLocaleString(language)}),
      ]);
    }; break;
    default: {
      description = translate('music_loop.off');
    };
  }
  return displayReply(context, {description});
}

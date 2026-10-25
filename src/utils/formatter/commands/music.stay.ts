import { Command, Interaction } from 'detritus-client';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayDetails, displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getTranslator } from '../../i18n';

import { canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.stay';

export interface CommandArgs {
  // null shows it
  enabled: boolean | null,
  // with 24/7, pausing when everyone else leaves the channel (off by default), null leaves it
  pauseAlone?: boolean | null,
}

// 24/7, a premium server perk that's on by default: the bot stays in voice when the queue runs out or it's paused, and
// rejoins its channel after restarting. Off, it leaves like on a free server (now, if nothing's playing). Changing it
// needs manage server or the dj role. `pauseAlone` pauses it while nobody else is in the channel
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const pauseAlone = (typeof(args.pauseAlone) === 'boolean') ? args.pauseAlone : undefined;
  if (args.enabled === null && pauseAlone === undefined) {
    return displayReply(context, {description: stayText(translate, await fetchGuildMusic(context, guildId))});
  }
  if (!canManageMusic(context.member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
  }
  const stay = (args.enabled === null) ? undefined : args.enabled;
  const music = await editGuildMusic(context, guildId, {pauseAlone, stay});
  if (stay === false) {
    VoiceNode.unstay(guildId);
  }
  if (pauseAlone) {
    // everyone might have left already
    VoiceNode.handleListeners(guildId);
  }
  return displayReply(context, {description: stayText(translate, music)});
}


// on (what it does, or that it needs premium, and whether it pauses alone) or off
function stayText(translate: Translator['translate'], music: RestResponsesRaw.FetchGuildMusic): string {
  if (!music.stay) {
    return translate('music_stay.off');
  }
  return displayDetails([
    translate('music_stay.on'),
    `-# ${translate((music.premium) ? 'music_stay.explanation' : 'music_stay.needs_premium')}`,
    `-# ${translate((music.pause_alone) ? 'music_stay.pause_alone_on' : 'music_stay.pause_alone_off')}`,
  ]);
}

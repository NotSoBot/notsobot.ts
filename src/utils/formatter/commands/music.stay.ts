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
}

// 24/7, a premium server perk that's on by default: the bot stays in voice when the queue runs out or it's paused, and
// rejoins its channel after restarting. Off, it leaves like on a free server (now, if nothing's playing). Changing it
// needs manage server or a notsomusic role
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  if (args.enabled === null) {
    return displayReply(context, {description: stayText(translate, await fetchGuildMusic(context, guildId))});
  }
  if (!canManageMusic(context.member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
  }
  const music = await editGuildMusic(context, guildId, {stay: args.enabled});
  if (!args.enabled) {
    VoiceNode.unstay(guildId);
  }
  return displayReply(context, {description: stayText(translate, music)});
}


// on (what it does, or that it needs premium) or off
function stayText(translate: Translator['translate'], music: RestResponsesRaw.FetchGuildMusic): string {
  if (!music.stay) {
    return translate('music_stay.off');
  }
  return displayDetails([
    translate('music_stay.on'),
    `-# ${translate((music.premium) ? 'music_stay.explanation' : 'music_stay.needs_premium')}`,
  ]);
}

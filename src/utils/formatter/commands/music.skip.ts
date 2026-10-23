import { Command, Interaction } from 'detritus-client';

import { fetchGuildMusic } from '../../../api';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { musicItemTitle } from './music.shared';


export const COMMAND_ID = 'music.skip';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  // what's playing before it's skipped, for the reply
  const music = (guildId && VoiceNode.isPlaying(guildId)) ? await fetchGuildMusic(context, guildId) : null;
  if (!guildId || !music || !music.current || !await VoiceNode.skip(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  return displayReply(context, {description: translate('music_skip.skipped', {title: musicItemTitle(music.current)})});
}

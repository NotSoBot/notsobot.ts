import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.resume';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const player = (context.guildId) ? await VoiceNode.setPaused(context.guildId, false) : null;
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  return displayReply(context, {
    description: translate('music_resume.resumed_at', {position: Markup.codestring(formatTime(player.state.position))}),
  });
}

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.seek';

export interface CommandArgs {
  // seconds
  position: number,
}

export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const position = Math.round(args.position * 1000);
  const player = (context.guildId) ? await VoiceNode.seek(context.guildId, position) : null;
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  return displayReply(context, {
    description: translate('music_seek.seeked_to', {position: Markup.codestring(formatTime(position))}),
  });
}

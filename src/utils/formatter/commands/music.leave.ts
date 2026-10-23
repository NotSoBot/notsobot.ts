import { Command, Interaction } from 'detritus-client';

import { deleteGuildMusic } from '../../../api';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.leave';

// stops the music, leaves and empties the queue
export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  // the voice node's channel, or one we're still in without it knowing (like after the node lost our players)
  const me = context.guild && context.guild.me;
  const channelId = (guildId && VoiceNode.guilds.get(guildId)?.channelId) || (me && me.voiceState && me.voiceState.channelId);
  if (!guildId || !channelId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  if (VoiceNode.guilds.has(guildId)) {
    VoiceNode.leave(guildId, true);
  } else {
    context.client.gateway.voiceStateUpdate(guildId, null);
    await deleteGuildMusic(context, guildId);
  }
  return displayReply(context, {description: translate('music_leave.left_channel', {channel: `<#${channelId}>`})});
}

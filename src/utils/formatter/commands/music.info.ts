import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { displayDetails, displayDetailsLine, displayLinks, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { musicItemFileName } from './music.shared';


export const COMMAND_ID = 'music.info';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  const guild = (guildId) ? VoiceNode.guilds.get(guildId) : undefined;
  const music = (guildId && guild) ? await fetchGuildMusic(context, guildId) : null;
  const current = music && music.current;
  if (!guild || !current || !current.track) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  const player = await VoiceNode.getPlayer(guildId!);
  const position = (player) ? player.state.position : 0;
  const connected = !!player && player.state.connected;
  return displayReply(context, {
    description: displayDetails([
      displayDetailsLine([
        Markup.codestring(`${formatTime(position)} / ${formatTime(current.track.duration)}`),
        (guild.channelId) ? `<#${guild.channelId}>` : null,
        `<@${current.user_id}>`,
        (player && player.paused) ? translate('music_info.paused') : null,
        (!connected) ? translate('music_info.connecting') : null,
      ]),
      displayDetailsLine([
        (connected && 0 <= player.state.ping) ? translate('music_info.ping', {ping: player.state.ping}) : null,
      ], true),
      // a converted link's file on cdn.nsb.gg, and where it's from (an opus.rip track's service page)
      displayLinks([['File', current.track.url], ['Source', /^https?:\/\//.test(current.url) ? current.url : null]]),
    ]),
    // a link's file name (its converted title is always `music.ogg`), linking to it
    ...(current.source === 'url') ?
      {title: Markup.codestring(musicItemFileName(current)), url: current.url} :
      {title: current.track.title},
  });
}

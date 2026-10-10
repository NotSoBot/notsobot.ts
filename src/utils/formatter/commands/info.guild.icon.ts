import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';

import { editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  payload: {
    channels?: Collections.BaseCollection<string, Structures.Channel>,
    emojis?: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild | null,
    memberCount?: number,
    owner?: Structures.User,
    presenceCount?: number,
    voiceStateCount?: number,
  },
}

export interface CommandArgs {
  payload: {
    channels: Collections.BaseCollection<string, Structures.Channel>,
    emojis: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild,
    memberCount: number,
    owner: Structures.User,
    presenceCount: number,
    voiceStateCount: number,
  },
}


export const COMMAND_ID = 'guildicon';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { guild } = args.payload;
  if (guild.icon) {
    const url = guild.iconUrlFormat(null, {size: 512}) as string;

    const channel = context.channel;
    if (channel && channel.canEmbedLinks) {
      const embed = new Embed();
      embed.setAuthor(guild.name, url, guild.jumpLink);
      embed.setColor(Colors.BLURPLE);
      embed.setDescription(`[**Icon Url**](${guild.iconUrl})`);
      embed.setImage(url);

      return editOrReply(context, {embed});
    }
    return editOrReply(context, url);
  }
  return editOrReply(context, 'Guild doesn\'t have an icon.');
}

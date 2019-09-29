import { Collections, Command, Constants, Structures, Utils } from 'detritus-client';

const { Colors } = Constants;

import { Parameters, onRunError, onTypeError } from '../utils';


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

export default (<Command.CommandOptions> {
  name: 'guildicon',
  label: 'guild',
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  type: Parameters.guildMetadata,
  onBeforeRun: (context, args) => !!args.payload.guild,
  onCancelRun: (context) => context.editOrReply('⚠ Unable to find that guild.'),
  run: async (context, args: CommandArgs) => {
    const { guild } = args.payload;
    if (guild.icon) {
      const url = <string> guild.iconUrlFormat(null, {size: 512});

      const channel = context.channel;
      if (channel && channel.canEmbedLinks) {
        const embed = new Utils.Embed();
        embed.setAuthor(guild.name, url, guild.jumpLink);
        embed.setColor(Colors.BLURPLE);
        embed.setDescription(`[**Icon Url**](${guild.iconUrl})`);
        embed.setImage(url);

        return context.editOrReply({content: '', embed});
      }
      return context.editOrReply(url);
    }
    return context.editOrReply('Guild doesn\'t have an icon.');
  },
  onRunError,
  onTypeError,
});

import { Collections, Command, CommandClient, Structures } from 'detritus-client';
import { Colors, Permissions } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';

import { CommandCategories } from '../../../constants';
import { Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


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


export const COMMAND_NAME = 'guildicon';

export default class GuildIconCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'payload',
      metadata: {
        description: 'Get the icon for a guild, defaults to the current guild',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 178313653177548800`,
        ],
        category: CommandCategories.INFO,
        usage: '?<guild:id>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.guildMetadata,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload.guild;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Unable to find that guild.');
  }

  async run(context: Command.Context, args: CommandArgs) {
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
}

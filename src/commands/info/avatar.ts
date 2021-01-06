import { Command, CommandClient, Structures } from 'detritus-client';

import { CommandTypes, PresenceStatusColors } from '../../constants';
import { DefaultParameters, Parameters, createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export default class AvatarCommand extends BaseCommand {
  name = 'avatar';

  default = DefaultParameters.author;
  label = 'user';
  metadata = {
    description: 'Get the avatar for a user, defaults to self',
    examples: [
      'user',
      'user notsobot',
    ],
    type: CommandTypes.INFO,
    usage: 'user ?<id|mention|name>',
  };
  type = Parameters.memberOrUser();

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unable to find that user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { user } = args;

    const { channel } = context;
    if (channel && channel.canEmbedLinks) {
      const embed = createUserEmbed(user);
      embed.setColor(PresenceStatusColors['offline']);
      embed.setDescription(`[**Avatar Url**](${user.avatarUrl})`);
      embed.setImage(user.avatarUrlFormat(null, {size: 512}));

      const presence = user.presence;
      if (presence && presence.status in PresenceStatusColors) {
        embed.setColor(PresenceStatusColors[presence.status]);
      }

      return context.editOrReply({embed});
    }
    return context.editOrReply(user.avatarUrl);
  }
}

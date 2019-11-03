import { Command, Constants, Structures, Utils } from 'detritus-client';
const { Embed } = Utils;

import { CommandTypes, PresenceStatusColors } from '../../constants';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export default class AvatarCommand extends BaseCommand {
  name = 'avatar';

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
  type = Parameters.memberOrUser;

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unable to find that user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { user } = args;

    const channel = context.channel;
    if (channel && channel.canEmbedLinks) {
      const embed = new Embed();
      embed.setAuthor(user.toString(), user.avatarUrlFormat(null, {size: 512}), user.jumpLink);
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

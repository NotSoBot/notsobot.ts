import { Command, Structures, Utils } from 'detritus-client';

import { CommandTypes, PresenceStatusColors } from '../constants';
import { Parameters } from '../utils';


export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export default (<Command.CommandOptions> {
  name: 'avatar',
  label: 'user',
  metadata: {
    description: 'Get the avatar for a user, defaults to self',
    examples: [
      'user',
      'user notsobot',
    ],
    type: CommandTypes.INFO,
    usage: 'user ?<id|mention|name>',
  },
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  type: Parameters.memberOrUser,
  onBeforeRun: (context, args) => !!args.user,
  onCancelRun: (context) => context.editOrReply('⚠ Unable to find that guy.'),
  run: async (context, args: CommandArgs) => {
    const { user } = args;

    const channel = context.channel;
    if (channel && channel.canEmbedLinks) {
      const embed = new Utils.Embed();
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
  },
  onRunError: (context, args, error) => {
    return context.editOrReply(`⚠ Error: ${error.message}`);
  },
});

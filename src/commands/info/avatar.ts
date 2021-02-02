import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, PresenceStatusColors } from '../../constants';
import { DefaultParameters, Parameters, createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  default: boolean,
  noembed: boolean,
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  default: boolean,
  noembed: boolean,
  user: Structures.Member | Structures.User,
}


export const COMMAND_NAME = 'avatar';

export default class AvatarCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'default', type: Boolean},
        {name: 'noembed', default: DefaultParameters.noEmbed, type: () => true},
      ],
      default: DefaultParameters.author,
      label: 'user',
      metadata: {
        description: 'Get the avatar for a user, defaults to self',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.INFO,
        usage: `${COMMAND_NAME} ?<user:id|mention|name> (-default) (-noembed)`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Unable to find that user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { user } = args;
    const avatarUrl = (args.default) ? user.defaultAvatarUrl : user.avatarUrl;
    if (!args.noembed) {
      const embed = createUserEmbed(user);
      embed.setColor(PresenceStatusColors['offline']);
      embed.setDescription(`[**Avatar Url**](${avatarUrl})`);

      if (args.default) {
        embed.setImage(avatarUrl);
      } else {
        embed.setImage(user.avatarUrlFormat(null, {size: 512}));
      }

      const presence = user.presence;
      if (presence && presence.status in PresenceStatusColors) {
        embed.setColor(PresenceStatusColors[presence.status]);
      }

      return editOrReply(context, {embed});
    }
    return editOrReply(context, avatarUrl);
  }
}

import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, PresenceStatusColors } from '../../../constants';
import { DefaultParameters, Parameters, createUserEmbed, editOrReply } from '../../../utils';

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
        usage: '?<user:id|mention|name> (-default) (-noembed)',
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

    let file: {filename: string, value: Buffer} | undefined;
    if (avatarUrl !== user.defaultAvatarUrl) {
      try {
        file = {
          filename: avatarUrl.split('/').pop()!,
          value: await context.rest.get(user.avatarUrlFormat(null, {size: 512})),
        };
      } catch(error) {

      }
    }

    if (!args.noembed) {
      const embed = createUserEmbed(user);
      embed.setColor(PresenceStatusColors['offline']);

      {
        const description: Array<string> = [];
        description.push(`[**Default**](${user.defaultAvatarUrl})`);
        if (user instanceof Structures.Member) {
          if (user.avatar) {
            description.push(`[**Server**](${user.avatarUrl})`);
          }
          if (user.user.avatar) {
            description.push(`[**User**](${user.user.avatarUrl})`);
          }
        } else {
          if (user.avatar) {
            description.push(`[**User**](${user.avatarUrl})`);
          }
        }
        embed.setDescription(description.join(', '));
      }

      if (args.default) {
        embed.setImage(avatarUrl);
      } else {
        const url = (file) ? `attachment://${file.filename}` : user.avatarUrlFormat(null, {size: 512});
        embed.setImage(url);
        if (file) {
          embed.setAuthor(undefined, url);
        }
      }

      const presence = user.presence;
      if (presence && presence.status in PresenceStatusColors) {
        embed.setColor(PresenceStatusColors[presence.status]);
      }

      return editOrReply(context, {embed, file});
    }

    if (file) {
      return editOrReply(context, {file});
    }
    return editOrReply(context, avatarUrl);
  }
}

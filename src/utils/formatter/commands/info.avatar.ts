import { Command, Interaction, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { RequestTypes } from 'detritus-client-rest';

import { utilitiesFetchMedia } from '../../../api';
import { PresenceStatusColors } from '../../../constants';
import { createUserEmbed, editOrReply } from '../../../utils';


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

export const COMMAND_ID = 'info.avatar';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { user } = args;

  let avatarUrl: string;
  if (args.default) {
    avatarUrl = user.defaultAvatarUrl;
  } else {
    avatarUrl = user.avatarUrlFormat(null, {size: 1024});
    args.default = (user.avatarUrl === user.defaultAvatarUrl);
  }

  let file: RequestTypes.File | undefined;
  if (!args.default) {
    try {
      const maxFileSize = (context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;
      const response = await utilitiesFetchMedia(context, {
        maxFileSize,
        url: avatarUrl,
      });
      file = {
        filename: response.file.filename,
        value: Buffer.from(response.file.value, 'base64'),
      };
    } catch(error) {
      
    }
  }

  if (args.noembed) {
    if (file) {
      return editOrReply(context, {file});
    }
    return editOrReply(context, avatarUrl);
  }

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
    const url = (file) ? `attachment://${file.filename}` : user.avatarUrlFormat(null, {size: 1024});
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

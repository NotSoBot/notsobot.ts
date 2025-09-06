import { Command, Interaction, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import UserAvatarDecorations from '../../../stores/useravatardecorations';

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
        value: (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0),
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
    description.push(Markup.url('**Default**', user.defaultAvatarUrl));
    if (user instanceof Structures.Member) {
      if (user.avatar) {
        description.push(Markup.url('**Server**', user.avatarUrl));
      }
      if (user.user.avatar) {
        description.push(Markup.url('**User**', user.user.avatarUrl));
      }
      if (user.avatarDecorationData) {
        const avatarDecoration = await UserAvatarDecorations.getOrFetch(
          context.client, user.avatarDecorationData.skuId, user.avatarDecorationData.asset,
        );
        let name: string;
        if (avatarDecoration.id === avatarDecoration.name) {
          name = '**Server Decoration**';
        } else {
          name = `**Server Decoration (${avatarDecoration.name})**`;
        }
        description.push(Markup.url(name, avatarDecoration.url));
      }
      if (user.user.avatarDecorationData) {
        const avatarDecoration = await UserAvatarDecorations.getOrFetch(
          context.client, user.user.avatarDecorationData.skuId, user.user.avatarDecorationData.asset,
        );
        let name: string;
        if (avatarDecoration.id === avatarDecoration.name) {
          name = '**User Decoration**';
        } else {
          name = `**User Decoration (${avatarDecoration.name})**`;
        }
        description.push(Markup.url(name, avatarDecoration.url));
      }
    } else {
      if (user.avatar) {
        description.push(Markup.url('**User**', user.avatarUrl));
      }
      if (user.avatarDecorationData) {
        const avatarDecoration = await UserAvatarDecorations.getOrFetch(
          context.client, user.avatarDecorationData.skuId, user.avatarDecorationData.asset,
        );
        let name: string;
        if (avatarDecoration.id === avatarDecoration.name) {
          name = '**User Decoration**';
        } else {
          name = `**User Decoration (${avatarDecoration.name})**`;
        }
        description.push(Markup.url(name, avatarDecoration.url));
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

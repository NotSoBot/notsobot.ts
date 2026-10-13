import { Command, Interaction, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import UserAvatarDecorations from '../../../stores/useravatardecorations';

import { utilitiesFetchMedia } from '../../../api';
import { PresenceStatusColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import { DisplayPayload, displayReply } from '../../../utils';


export interface CommandArgsBefore {
  default: boolean,
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  default: boolean,
  user: Structures.Member | Structures.User,
}

export const COMMAND_ID = 'info.avatar';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

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

  const payload: DisplayPayload = {fields: []};
  payload.title = user.toString();
  payload.url = user.jumpLink;
  payload.color = PresenceStatusColors['offline'];

  {
    const description: Array<string> = [];
    description.push(Markup.url(`**${translate('info.avatar.default')}**`, user.defaultAvatarUrl));
    if (user instanceof Structures.Member) {
      if (user.avatar) {
        description.push(Markup.url(`**${translate('info.avatar.server')}**`, user.avatarUrl));
      }
      if (user.user.avatar) {
        description.push(Markup.url(`**${translate('info.avatar.user')}**`, user.user.avatarUrl));
      }
      if (user.avatarDecorationData) {
        const avatarDecoration = await UserAvatarDecorations.getOrFetch(
          context.client, user.avatarDecorationData.skuId, user.avatarDecorationData.asset,
        );
        let name: string;
        if (avatarDecoration.id === avatarDecoration.name) {
          name = `**${translate('info.avatar.server_decoration')}**`;
        } else {
          name = `**${translate('info.avatar.server_decoration_named', {name: avatarDecoration.name})}**`;
        }
        description.push(Markup.url(name, avatarDecoration.url));
      }
      if (user.user.avatarDecorationData) {
        const avatarDecoration = await UserAvatarDecorations.getOrFetch(
          context.client, user.user.avatarDecorationData.skuId, user.user.avatarDecorationData.asset,
        );
        let name: string;
        if (avatarDecoration.id === avatarDecoration.name) {
          name = `**${translate('info.avatar.user_decoration')}**`;
        } else {
          name = `**${translate('info.avatar.user_decoration_named', {name: avatarDecoration.name})}**`;
        }
        description.push(Markup.url(name, avatarDecoration.url));
      }
    } else {
      if (user.avatar) {
        description.push(Markup.url(`**${translate('info.avatar.user')}**`, user.avatarUrl));
      }
      if (user.avatarDecorationData) {
        const avatarDecoration = await UserAvatarDecorations.getOrFetch(
          context.client, user.avatarDecorationData.skuId, user.avatarDecorationData.asset,
        );
        let name: string;
        if (avatarDecoration.id === avatarDecoration.name) {
          name = `**${translate('info.avatar.user_decoration')}**`;
        } else {
          name = `**${translate('info.avatar.user_decoration_named', {name: avatarDecoration.name})}**`;
        }
        description.push(Markup.url(name, avatarDecoration.url));
      }
    }
    payload.description = description.join(', ');
  }

  if (args.default) {
    payload.image = avatarUrl;
  } else {
    const url = (file) ? `attachment://${file.filename}` : user.avatarUrlFormat(null, {size: 1024});
    payload.image = url;
    if (file) {
      payload.files = [file];
    }
  }

  const presence = user.presence;
  if (presence && presence.status in PresenceStatusColors) {
    payload.color = PresenceStatusColors[presence.status];
  }

  return displayReply(context, payload);
}

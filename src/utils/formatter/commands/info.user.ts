import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import UserAvatarDecorations, { UserAvatarDecorationStored } from '../../../stores/useravatardecorations';

import { utilitiesFetchMedia } from '../../../api';
import { PresenceStatusColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  jobWaitForResponse,
} from '../../../utils';

import {
  createActivityLines,
  createMemberLines,
  createPresenceLine,
  createUserJoinedLine,
  createUserMentionLine,
} from './info.shared';


export const COMMAND_ID = 'info.user';

export const RESULTS_PER_PAGE = 3;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: {isEphemeral?: boolean, user: Structures.Member | Structures.User | Structures.UserWithBanner},
) {
  const translator = await getTranslator(context);
  const { translate } = translator;

  const isMember = (args.user instanceof Structures.Member);
  const member = args.user as Structures.Member;
  const user = ((isMember) ? member.user : args.user) as Structures.User;
  const userWithBanner = (args.user instanceof Structures.UserWithBanner) ? args.user : await context.rest.fetchUser(user.id);

  let avatarDecorationServer: UserAvatarDecorationStored | null = null;
  let avatarDecorationUser: UserAvatarDecorationStored | null = null;

  if (isMember) {
    if (member.avatarDecorationData) {
      avatarDecorationServer = await UserAvatarDecorations.getOrFetch(
        context.client,
        member.avatarDecorationData.skuId,
        member.avatarDecorationData.asset,
      );
    }
    if (member.user.avatarDecorationData) {
      avatarDecorationUser = await UserAvatarDecorations.getOrFetch(
        context.client,
        member.user.avatarDecorationData.skuId,
        member.user.avatarDecorationData.asset,
      );
    }
  } else {
    if (args.user.avatarDecorationData) {
      avatarDecorationUser = await UserAvatarDecorations.getOrFetch(
        context.client,
        args.user.avatarDecorationData.skuId,
        args.user.avatarDecorationData.asset,
      );
    }
  }

  const files: Array<RequestTypes.File> = [];

  const avatarUrl = member.avatarUrlFormat(null, {size: 1024});
  try {
    const maxFileSize = (context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;
    const response = await utilitiesFetchMedia(context, {
      maxFileSize,
      url: avatarUrl,
    }).then((x) => jobWaitForResponse(context, x));
    files.push({
      filename: response.file.filename,
      value: (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0),
    });
  } catch(error) {

  }

  const presence = user.presence;
  let activities: Array<Structures.PresenceActivity>;
  if (presence) {
    activities = presence.activities.sort((x, y) => {
      return x.position - y.position;
    });
  } else {
    activities = [];
  }
  const pageLimit = activities.length || 1;

  const paginator = new Paginator(context, {
    pageLimit,
    isEphemeral: args.isEphemeral,
    onPage: async (page) => {
      const payload: DisplayPayload = {};
      payload.color = PresenceStatusColors['offline'];
      payload.title = user.toString();
      payload.url = user.jumpLink;

      if (files.length) {
        const file = files[0]!;
        payload.thumbnail = `attachment://${file.filename}`;
      } else {
        payload.thumbnail = avatarUrl;
      }

      const lines: Array<string> = [createUserMentionLine(user)];
      lines.push(createUserJoinedLine(translator, user, (isMember) ? member : null));
      if (isMember) {
        lines.push(...createMemberLines(context, translator, member));
      }

      lines.push(createPresenceLine(translator, presence || null));
      if (presence) {
        if (presence.status in PresenceStatusColors) {
          payload.color = PresenceStatusColors[presence.status];
        }

        const activityId = page - 1;
        if (activityId in activities) {
          const title = (1 < pageLimit) ? translate('activity.title_paged', {page, total: pageLimit}) : translate('activity.title');
          lines.push(...createActivityLines(translator, activities[activityId], title));
        }
      }

      {
        let bannerColor: string | null = null;
        if (userWithBanner.accentColor !== null) {
          const color = intToRGB(userWithBanner.accentColor);
          bannerColor = `${Markup.codestring(intToHex(userWithBanner.accentColor, true))} ${Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`)}`;
        }
        lines.push(displayDetailsLine([
          (avatarDecorationServer) && displayDetail(translate('user.avatar_decoration_server'), Markup.url(avatarDecorationServer.name, `<${avatarDecorationServer.url}>`)),
          (avatarDecorationUser) && displayDetail(translate('user.avatar_decoration_user'), Markup.url(avatarDecorationUser.name, `<${avatarDecorationUser.url}>`)),
          (bannerColor) && displayDetail(translate('user.banner_color'), bannerColor),
        ]));
      }

      lines.push(displayDetailsLine([`${translate('common.id')}: ${Markup.codestring(user.id)}`], true));

      if (userWithBanner.banner) {
        payload.image = userWithBanner.bannerUrl!;
      }
      // only worth linking the avatar when there's something else to link with it
      if ((isMember && member.avatar) || userWithBanner.banner) {
        lines.push(displayLinks([
          [translate('user.user_avatar'), user.avatarUrl],
          [translate('user.guild_avatar'), (isMember && member.avatar) ? member.avatarUrl : null],
          [translate('user.user_banner'), (userWithBanner.banner) ? userWithBanner.bannerUrlFormat(null, {size: 512}) : null],
        ]));
      }

      payload.description = displayDetails(lines);

      return {display: {...payload, files}};
    },
  });
  return await paginator.start();
}

import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import UserAvatarDecorations, { UserAvatarDecorationStored, getAvatarDecorationName } from '../../../stores/useravatardecorations';
import UserStore from '../../../stores/users';

import { fetchUser, utilitiesFetchMedia } from '../../../api';
import { UserFull } from '../../../api/structures/user';
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
  createNotSoBotLine,
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
  const avatarUrl = member.avatarUrlFormat(null, {size: 1024});
  // none of these depend on each other, the avatar job alone polls for a while
  const [ userWithBanner, avatarDecorationServer, avatarDecorationUser, notsoUser, files ] = await Promise.all([
    (args.user instanceof Structures.UserWithBanner) ? args.user : context.rest.fetchUser(user.id),
    (async (): Promise<UserAvatarDecorationStored | null> => {
      if (isMember && member.avatarDecorationData) {
        return UserAvatarDecorations.getOrFetch(context.client, member.avatarDecorationData.skuId, member.avatarDecorationData.asset);
      }
      return null;
    })(),
    (async (): Promise<UserAvatarDecorationStored | null> => {
      if (user.avatarDecorationData) {
        return UserAvatarDecorations.getOrFetch(context.client, user.avatarDecorationData.skuId, user.avatarDecorationData.asset);
      }
      return null;
    })(),
    // what NotSoBot has on them, only read (looking someone up shouldn't make them a NotSoBot user). Unknown to us is a 404
    (async (): Promise<UserFull | null> => {
      const stored = UserStore.get(user.id) || null;
      if (stored || user.bot) {
        return stored;
      }
      try {
        return await fetchUser(context, user.id);
      } catch(error) {
        return null;
      }
    })(),
    (async (): Promise<Array<RequestTypes.File>> => {
      try {
        const maxFileSize = (context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;
        const response = await utilitiesFetchMedia(context, {
          maxFileSize,
          url: avatarUrl,
        }).then((x) => jobWaitForResponse(context, x));
        const { file } = response.items[0];
        return [{
          filename: file.filename,
          value: (file.value) ? Buffer.from(file.value, 'base64') : Buffer.alloc(0),
        }];
      } catch(error) {
        return [];
      }
    })(),
  ]);

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
      if (notsoUser) {
        lines.push(createNotSoBotLine(context, translator, notsoUser));
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
          (avatarDecorationServer) && displayDetail(translate('user.avatar_decoration_server'), Markup.url(getAvatarDecorationName(avatarDecorationServer) || avatarDecorationServer.id, `<${avatarDecorationServer.url}>`)),
          (avatarDecorationUser) && displayDetail(translate('user.avatar_decoration_user'), Markup.url(getAvatarDecorationName(avatarDecorationUser) || avatarDecorationUser.id, `<${avatarDecorationUser.url}>`)),
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

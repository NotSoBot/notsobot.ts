import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { PresenceStatusColors, StatusEmojis } from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  displayReply,
} from '../../../utils';

import {
  createActivityLines,
  createMemberLines,
  createPresenceLine,
  createUserJoinedLine,
  createUserMentionLine,
} from './info.shared';


export interface CommandArgsBefore {
  bots: boolean,
  hasnick: boolean,
  role?: Structures.Role,
  users: Array<Structures.Member | Structures.User>,
}

export interface CommandArgs {
  bots: boolean,
  hasnick: boolean,
  role?: Structures.Role,
  users: Array<Structures.Member | Structures.User>,
}


export const COMMAND_ID = 'info.users';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;

  const { users } = args;

  let membersOrUsers = users;
  if (args.bots) {
    membersOrUsers = membersOrUsers.filter((memberOrUser) => memberOrUser.bot);
  }
  if (args.hasnick || args.role) {
    membersOrUsers = membersOrUsers.filter((memberOrUser) => {
      if (memberOrUser instanceof Structures.Member) {
        if (args.hasnick && !memberOrUser.nick) {
          return false;
        }
        if (args.role && !memberOrUser.roles.has(args.role.id)) {
          return false;
        }
        return true;
      }
      return false;
    });
  }
  membersOrUsers = membersOrUsers.sort((x, y) => {
    if (x instanceof Structures.Member && y instanceof Structures.Member) {
      return x.joinedAtUnix - y.joinedAtUnix;
    } else if (x instanceof Structures.Member) {
      return x.joinedAtUnix - 0;
    } else if (y instanceof Structures.Member) {
      return 0 - y.joinedAtUnix;
    }
    return 0;
  });

  const pageLimit = membersOrUsers.length;
  if (pageLimit === 0) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('info.users.not_found')}`});
  }

  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const position = page - 1;
      if (!(position in membersOrUsers)) {
        throw new Error('lol');
      }
      const memberOrUser = membersOrUsers[position];

      const isMember = (memberOrUser instanceof Structures.Member);
      const member = memberOrUser as Structures.Member;
      const user = ((isMember) ? member.user : memberOrUser) as Structures.User;

      const payload: DisplayPayload = {};
      payload.title = user.toString();
      payload.url = user.jumpLink;
      payload.color = PresenceStatusColors['offline'];
      payload.thumbnail = member.avatarUrlFormat(null, {size: 1024});
      payload.footer = translate('user.page', {page: page.toLocaleString(language), total: pageLimit.toLocaleString(language)});

      const lines: Array<string> = [createUserMentionLine(user)];
      lines.push(createUserJoinedLine(translator, user, (isMember) ? member : null));
      if (isMember) {
        lines.push(...createMemberLines(context, translator, member));
      }

      const presence = user.presence;
      lines.push(createPresenceLine(translator, presence || null));
      if (presence) {
        if (presence.status in PresenceStatusColors) {
          payload.color = PresenceStatusColors[presence.status];
        }

        const activity = presence.activity;
        if (activity) {
          const title = (presence.activities.length !== 1) ? translate('activity.title_paged', {page: 1, total: presence.activities.length}) : translate('activity.title');
          lines.push(...createActivityLines(translator, activity, title));
        }
      }

      lines.push(displayDetailsLine([`${translate('common.id')}: ${Markup.codestring(user.id)}`], true));
      if (isMember && member.avatar) {
        lines.push(displayLinks([
          [translate('user.user_avatar'), user.avatarUrl],
          [translate('user.guild_avatar'), member.avatarUrl],
        ]));
      }

      payload.description = displayDetails(lines);

      return {display: payload};
    },
  });
  return await paginator.start();
}

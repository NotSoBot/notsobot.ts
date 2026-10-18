import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { PresenceStatusColors, StatusEmojis } from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  displayDetails,
  displayDetailsLine,
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
  text: string,
}

export interface CommandArgs {
  text: string,
}


export function activityFilter(activity: Structures.PresenceActivity, text: string): boolean {
  if (activity.name.toLowerCase().includes(text)) {
    return true;
  }
  if (activity.state && activity.state.toLowerCase().includes(text)) {
    return true;
  }
  if (activity.details && activity.details.toLowerCase().includes(text)) {
    return true;
  }
  if (activity.applicationId === text) {
    return true;
  }
  if (activity.application) {
    const { application } = activity;
    if (application.name.toLowerCase().includes(text)) {
      return true;
    }
    if (application.aliases && application.aliases.length) {
      return application.aliases.some((name) => {
        return name.toLowerCase().includes(text);
      });
    }
  }
  return false;
}


export const COMMAND_ID = 'info.playing';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;

  const guild =  context.guild as Structures.Guild;

  const presences = guild.presences.filter((presence) => {
    return presence.activities.some((activity) => activityFilter(activity, args.text));
  });
  if (presences.length) {
    const members = (presences
      .map((presence) => guild.members.get(presence.user.id))
      .filter((member) => member) as Array<Structures.Member>)
      .sort((x, y) => x.joinedAtUnix - y.joinedAtUnix);

    const pageLimit = members.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const member = members[page - 1];
        const user = member;

        const payload: DisplayPayload = {};
        payload.title = user.toString();
        payload.url = user.jumpLink;
        payload.color = PresenceStatusColors['offline'];
        payload.thumbnail = user.avatarUrlFormat(null, {size: 1024});
        payload.footer = translate('user.page', {page: page.toLocaleString(language), total: pageLimit.toLocaleString(language)});

        const lines: Array<string> = [createUserMentionLine(member.user)];
        lines.push(createUserJoinedLine(translator, member.user, member));
        lines.push(...createMemberLines(context, translator, member));

        const presence = user.presence;
        lines.push(createPresenceLine(translator, presence || null));
        if (presence) {
          if (presence.status in PresenceStatusColors) {
            payload.color = PresenceStatusColors[presence.status];
          }

          const activity = presence.activities.find((activity) => activityFilter(activity, args.text));
          if (activity) {
            const title = (presence.activities.length !== 1) ? translate('activity.title_paged', {page: activity.position + 1, total: presence.activities.length}) : translate('activity.title');
            lines.push(...createActivityLines(translator, activity, title));
          }
        }

        lines.push(displayDetailsLine([`${translate('common.id')}: ${Markup.codestring(user.id)}`], true));
        payload.description = displayDetails(lines);

        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('info.playing.not_found')}`});
}

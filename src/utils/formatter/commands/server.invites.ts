import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import { DisplayPayload, Paginator, chunkArray, displayReply } from '../../../utils';


export const COMMAND_ID = 'server.invites';

export const INVITES_PER_PAGE = 10;

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const guild = context.guild!;

  const invites = (await context.rest.fetchGuildInvites(guild.id)).toArray().sort((x, y) => {
    // most used first, then newest
    const uses = (y.uses || 0) - (x.uses || 0);
    return (uses) ? uses : (y.createdAtUnix - x.createdAtUnix);
  });
  if (!invites.length) {
    return displayReply(context, {description: translate('server_invites.none')});
  }

  const pages = chunkArray<Structures.Invite>(invites, INVITES_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const description: Array<string> = [];
      for (let invite of pages[page - 1]) {
        description.push(`**${Markup.url(Markup.codestring(invite.code), invite.url)}** · <#${invite.channel.id}>`);

        const details: Array<string> = [];
        details.push(translate('server_invites.inviter', {user: (invite.inviter) ? invite.inviter.mention : translate('common.unknown')}));
        if (invite.maxUses) {
          details.push(translate('server_invites.uses_limited', {max: invite.maxUses.toLocaleString(language), uses: (invite.uses || 0).toLocaleString(language)}));
        } else {
          details.push(translate('server_invites.uses', {uses: (invite.uses || 0).toLocaleString(language)}));
        }
        if (invite.expiresAt) {
          details.push(translate('server_invites.expires', {timestamp: `<t:${Math.floor(invite.expiresAtUnix / 1000)}:R>`}));
        } else {
          details.push(translate('server_invites.never_expires'));
        }
        if (invite.temporary) {
          details.push(translate('server_invites.temporary'));
        }
        description.push(`-> ${details.join(' · ')}`);
      }

      const payload: DisplayPayload = {
        color: EmbedColors.DEFAULT,
        description: description.join('\n'),
        footer: translate('server_invites.footer', {
          page,
          pageLimit,
          total: invites.length.toLocaleString(language),
        }),
      };
      return {display: payload};
    },
  });
  return await paginator.start();
}

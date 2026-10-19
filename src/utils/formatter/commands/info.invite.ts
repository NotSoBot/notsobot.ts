import { Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import {
  ChannelTypesText,
  StatusEmojis,
  VerificationLevelTexts,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  displayReply,
  displayTimestamp,
  toTitleCase,
} from '../../../utils';


export interface CommandArgsBefore {
  code: string,
}

export interface CommandArgs {
  code: string,
}


export const COMMAND_ID = 'info.invite';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  try {
    const invite = await context.rest.fetchInvite(args.code, {withCounts: true});

    const payload: DisplayPayload = {};
    payload.color = Colors.BLURPLE;
    payload.url = Endpoints.Invite.SHORT(invite.code);

    const { guild } = invite;
    const channel = invite.channel as Structures.Channel;

    payload.footer = `discord.gg/${invite.code}`;
    payload.footerIconUrl = (guild && guild.iconUrlFormat(null, {size: 1024})) || undefined;
    payload.title = (guild) ? guild.name : channel.name;

    const lines: Array<string> = [];
    const channelType = translateMaybe(`channel.type.${channel.type}`, ChannelTypesText[channel.type] || String(channel.type));

    if (guild) {
      if (guild.banner) {
        payload.thumbnail = guild.bannerUrlFormat(null, {size: 1024}) as string;
      } else if (guild.icon) {
        payload.thumbnail = guild.iconUrlFormat(null, {size: 1024}) as string;
      }
      if (guild.splash) {
        payload.image = guild.splashUrlFormat(null, {size: 128}) as string;
      }
      if (guild.description) {
        lines.push(guild.description);
      }

      lines.push(displayDetailsLine([
        displayDetail(translate('info.guild.members'), (invite.approximateMemberCount || 0).toLocaleString(language)),
        displayDetail(translate('info.guild.members_online'), (invite.approximatePresenceCount || 0).toLocaleString(language)),
        displayDetail(translate('info.guild.verification_level'), translateMaybe(`guild.verification.${guild.verificationLevel}`, VerificationLevelTexts[guild.verificationLevel] || translate('common.unknown'))),
      ]));
      lines.push(displayDetailsLine([
        displayDetail(translate('common.created'), displayTimestamp(guild.createdAtUnix)),
        displayDetail(translate('info.guild.acronym'), guild.acronym),
        (guild.vanityUrlCode) && displayDetail(translate('info.guild.vanity'), Markup.url(guild.vanityUrlCode, `<${Endpoints.Invite.SHORT(guild.vanityUrlCode)}>`)),
      ]));
    }

    lines.push(displayDetailsLine([
      displayDetail(translate('common.channel'), `${Markup.escape.all(channel.name)} (${channelType})`),
      displayDetail(translate('common.created'), displayTimestamp(channel.createdAtUnix)),
    ]));

    if (guild && guild.features.length) {
      const features = guild.features.toArray().sort().map((feature: string) => toTitleCase(feature));
      lines.push(`-# ${translate('common.features')}: ${features.join(', ')}`);
    }

    lines.push(displayDetailsLine([
      (guild) && `${translate('info.channel.guild_id')}: ${Markup.codestring(guild.id)}`,
      `${translate('common.channel')}: ${Markup.codestring(channel.id)}`,
    ], true));

    {
      const links: Array<[string, null | string | undefined]> = [
        [translate('info.invite.invite'), Endpoints.Invite.SHORT(invite.code)],
        [translate('common.channel'), channel.jumpLink],
      ];
      if (guild) {
        links.push(
          [translate('common.guild'), guild.jumpLink],
          [translate('info.guild.icon_image'), guild.iconUrlFormat(null, {size: 1024})],
          [translate('info.guild.banner_image'), guild.bannerUrlFormat(null, {size: 1024})],
          [translate('info.guild.splash_image'), guild.splashUrlFormat(null, {size: 1024})],
        );
      }
      lines.push(displayLinks(links));
    }

    payload.description = displayDetails(lines);

    return displayReply(context, payload);
  } catch(error) {
    let message: string;
    if (error.response && error.response.statusCode === 404) {
      message = `${StatusEmojis.WARNING} ${translate('info.invite.unknown')}`;
    } else {
      message = `${StatusEmojis.WARNING} ${error}`;
    }
    return displayReply(context, {description: message});
  }
}

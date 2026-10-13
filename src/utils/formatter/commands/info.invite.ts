import { Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import {
  ChannelTypesText,
  DateMomentLogFormat,
  StatusEmojis,
  VerificationLevelTexts,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import { DisplayPayload, createTimestampMomentFromGuild, displayReply, toTitleCase } from '../../../utils';


export interface CommandArgsBefore {
  code: string,
}

export interface CommandArgs {
  code: string,
}


export const COMMAND_ID = 'inviteinfo';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  try {
    const invite = await context.rest.fetchInvite(args.code, {withCounts: true});

    const payload: DisplayPayload = {fields: []};
    payload.color = Colors.BLURPLE;
    payload.url = Endpoints.Invite.SHORT(invite.code);

    const { guild } = invite;
    const channel = invite.channel as Structures.Channel;

    payload.footer = `discord.gg/${invite.code}`;
    payload.footerIconUrl = (guild && guild.iconUrlFormat(null, {size: 1024})) || undefined;

    if (guild) {
      payload.title = guild.name;
    } else {
      payload.title = channel.name;
    }

    {
      const description: Array<string> = [];
      {
        const timestamp = createTimestampMomentFromGuild(channel.createdAtUnix, context.guildId);
        description.push(`**${translate('common.created')}**: ${timestamp.locale(language).fromNow()}`);
        description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
      }
      description.push(`**${translate('common.id')}**: ${Markup.codestring(channel.id)}`);
      description.push(`**${translate('common.name')}**: ${Markup.escape.all(channel.name)}`);
      description.push(`**${translate('common.type')}**: ${translateMaybe(`channel.type.${channel.type}`, ChannelTypesText[channel.type] || String(channel.type))}`);
      payload.fields!.push({inline: true, name: translate('info.invite.channel_information'), value: description.join('\n')});
    }

    if (guild) {
      if (guild.banner) {
        payload.thumbnail = guild.bannerUrlFormat(null, {size: 1024}) as string;
      } else {
        if (guild.icon) {
          payload.thumbnail = guild.iconUrlFormat(null, {size: 1024}) as string;
        }
      }

      if (guild.splash) {
        payload.image = guild.splashUrlFormat(null, {size: 128}) as string;
      }

      if (guild.description) {
        payload.description = guild.description;
      }

      {
        const description: Array<string> = [];
        description.push(`**${translate('info.guild.acronym')}**: ${guild.acronym}`);
        {
          const timestamp = createTimestampMomentFromGuild(guild.createdAtUnix, context.guildId);
          description.push(`**${translate('common.created')}**: ${timestamp.locale(language).fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        description.push(`**${translate('common.id')}**: ${Markup.codestring(guild.id)}`);
        description.push(`**${translate('info.guild.members')}**: ${(invite.approximateMemberCount || 0).toLocaleString(language)}`);
        description.push(`**${translate('info.guild.members_online')}**: ${(invite.approximatePresenceCount || 0).toLocaleString(language)}`);
        description.push(`**${translate('common.name')}**: ${Markup.escape.all(guild.name)}`);
        if (guild.vanityUrlCode) {
          description.push(`**${translate('info.guild.vanity')}**: ${Markup.url(guild.vanityUrlCode, Endpoints.Invite.SHORT(guild.vanityUrlCode))}`);
        }
        description.push(`**${translate('info.guild.verification_level')}**: ${translateMaybe(`guild.verification.${guild.verificationLevel}`, VerificationLevelTexts[guild.verificationLevel] || translate('common.unknown'))}`);

        payload.fields!.push({inline: true, name: translate('info.invite.guild_information'), value: description.join('\n')});
      }

      if (guild.features.length) {
        const description = guild.features.toArray().sort().map((feature: string) => toTitleCase(feature));
        payload.fields!.push({name: translate('common.features'), value: Markup.codeblock(description.join('\n'))});
      }
    }

    {
      const description: Array<string> = [];
      description.push(`[**${translate('common.channel')}**](${channel.jumpLink})`);
      description.push(`[**${translate('info.invite.invite')}**](${Endpoints.Invite.SHORT(invite.code)})`);

      if (guild) {
        if (guild.banner) {
          description.push(`[**${translate('info.guild.banner_image')}**](${guild.bannerUrlFormat(null, {size: 1024})})`);
        }
        description.push(`[**${translate('common.guild')}**](${guild.jumpLink})`);
        if (guild.icon) {
          description.push(`[**${translate('info.guild.icon_image')}**](${guild.iconUrlFormat(null, {size: 1024})})`);
        }
        if (guild.splash) {
          description.push(`[**${translate('info.guild.splash_image')}**](${guild.splashUrlFormat(null, {size: 1024})})`);
        }
      }

      payload.fields!.push({name: translate('common.urls'), value: description.sort().join(', ')});
    }

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

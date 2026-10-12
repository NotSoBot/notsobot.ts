import { Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import {
  ChannelTypesText,
  DateMomentLogFormat,
  StatusEmojis,
  VerificationLevelTexts,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import { createTimestampMomentFromGuild, editOrReply, toTitleCase } from '../../../utils';


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

    const embed = new Embed();
    embed.setColor(Colors.BLURPLE);
    embed.setTitle(`discord.gg/${invite.code}`);

    const { guild } = invite;
    const channel = invite.channel as Structures.Channel;

    if (guild) {
      embed.setAuthor(guild.name, guild.iconUrlFormat(null, {size: 1024}) || undefined, guild.jumpLink);
    } else {
      embed.setAuthor(channel.name, undefined, channel.jumpLink);
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
      embed.addField(translate('info.invite.channel_information'), description.join('\n'), true);
    }

    if (guild) {
      if (guild.banner) {
        embed.setThumbnail(guild.bannerUrlFormat(null, {size: 1024}) as string);
      } else {
        if (guild.icon) {
          embed.setThumbnail(guild.iconUrlFormat(null, {size: 1024}) as string);
        }
      }

      if (guild.splash) {
        embed.setImage(guild.splashUrlFormat(null, {size: 128}) as string);
      }

      if (guild.description) {
        embed.setDescription(guild.description);
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

        embed.addField(translate('info.invite.guild_information'), description.join('\n'), true);
      }

      if (guild.features.length) {
        const description = guild.features.toArray().sort().map((feature: string) => toTitleCase(feature));
        embed.addField(translate('common.features'), Markup.codeblock(description.join('\n')));
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

      embed.addField(translate('common.urls'), description.sort().join(', '));
    }

    return editOrReply(context, {embed});
  } catch(error) {
    let message: string;
    if (error.response && error.response.statusCode === 404) {
      message = `${StatusEmojis.WARNING} ${translate('info.invite.unknown')}`;
    } else {
      message = `${StatusEmojis.WARNING} ${error}`;
    }
    return editOrReply(context, message);
  }
}

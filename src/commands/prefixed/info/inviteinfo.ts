import { Command, CommandClient, Structures } from 'detritus-client';
import { Colors, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup, guildIdToShardId } from 'detritus-client/lib/utils';

import { Endpoints } from 'detritus-client-rest';


import {
  CommandTypes,
  DateMomentLogFormat,
  VerificationLevelTexts,
} from '../../../constants';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  code: string,
}

export interface CommandArgs {
  code: string,
}


export const COMMAND_NAME = 'inviteinfo';

export default class InviteInfoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'code',
      metadata: {
        description: 'Get information of a discord invite',
        examples: [
          `${COMMAND_NAME} 9Ukuw9V`,
        ],
        type: CommandTypes.INFO,
        usage: '<code>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.code;
  }

  async run(context: Command.Context, args: CommandArgs) {
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
          description.push(`**Created**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        description.push(`**Id**: ${Markup.codestring(channel.id)}`);
        description.push(`**Name**: ${Markup.escape.all(channel.name)}`);
        description.push(`**Type**: ${channel.type}`);
        embed.addField('Channel Information', description.join('\n'), true);
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
          description.push(`**Acronym**: ${guild.acronym}`);
          {
            const timestamp = createTimestampMomentFromGuild(guild.createdAtUnix, context.guildId);
            description.push(`**Created**: ${timestamp.fromNow()}`);
            description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
          }
          description.push(`**Id**: ${Markup.codestring(guild.id)}`);
          description.push(`**Members**: ${(invite.approximateMemberCount || 0).toLocaleString()}`);
          description.push(`**Members Online**: ${(invite.approximatePresenceCount || 0).toLocaleString()}`);
          description.push(`**Name**: ${Markup.escape.all(guild.name)}`);
          if (guild.vanityUrlCode) {
            description.push(`**Vanity**: ${Markup.url(guild.vanityUrlCode, Endpoints.Invite.SHORT(guild.vanityUrlCode))}`);
          }
          description.push(`**Verification Level**: ${VerificationLevelTexts[guild.verificationLevel] || 'Unknown'}`);

          embed.addField('Guild Information', description.join('\n'), true);
        }

        if (guild.features.length) {
          const description = guild.features.toArray().sort().map((feature: string) => toTitleCase(feature));
          embed.addField('Features', Markup.codeblock(description.join('\n')));
        }
      }

      {
        const description: Array<string> = [];
        description.push(`[**Channel**](${channel.jumpLink})`);
        description.push(`[**Invite**](${Endpoints.Invite.SHORT(invite.code)})`);

        if (guild) {
          if (guild.banner) {
            description.push(`[**Banner Image**](${guild.bannerUrlFormat(null, {size: 1024})})`);
          }
          description.push(`[**Guild**](${guild.jumpLink})`);
          if (guild.icon) {
            description.push(`[**Icon Image**](${guild.iconUrlFormat(null, {size: 1024})})`);
          }
          if (guild.splash) {
            description.push(`[**Splash Image**](${guild.splashUrlFormat(null, {size: 1024})})`);
          }
        }

        embed.addField('Urls', description.sort().join(', '));
      }

      return editOrReply(context, {embed});
    } catch(error) {
      let message: string;
      if (error.response && error.response.statusCode === 404) {
        message = '⚠ Unknown Invite';
      } else {
        message = `⚠ ${error}`;
      }
      return editOrReply(context, message);
    }
  }
}

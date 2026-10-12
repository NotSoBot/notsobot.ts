import { ClusterClient, Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Embed, Markup, guildIdToShardId } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import { DateMomentLogFormat } from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  Paginator,
  Parameters,
  createTimestampMomentFromGuild,
} from '../../../utils';


export interface CommandArgsBefore {
  payload: SharedGuildPayload,
}

export interface CommandArgs {
  payload: {
    results: Array<GuildResult>,
    user: Structures.Member | Structures.User,
  },
}

export interface GuildResult {
  guild: Structures.Guild,
  joinPosition: number,
  member: Structures.Member,
  owner: Structures.User,
}

export interface SharedGuildPayload {
  results: Array<GuildResult>,
  user: Structures.Member | Structures.User | null,
}

export async function getSharedGuilds(value: string, context: Command.Context | Interaction.InteractionContext): Promise<SharedGuildPayload> {
  // value will be our userId if they didnt send anything in
  const findMemberOrUser = Parameters.memberOrUser();
  const user = await findMemberOrUser(value, context);

  let results: Array<GuildResult>;
  if (user && !user.bot) {
    if (context.manager) {
      const chunks = await context.manager.broadcastEval((cluster: ClusterClient, userId: string) => {
        return cluster.shards.map((shard) => {
          return shard.guilds.filter((guild) => guild.members.has(userId)).map((guild) => {
            return {
              guild: {
                description: guild.description,
                features: guild.features,
                icon: guild.icon,
                id: guild.id,
                member_count: guild.memberCount,
                name: guild.name,
                owner_id: guild.ownerId,
                preferred_locale: guild.preferredLocale,
                premium_subscription_count: guild.premiumSubscriptionCount,
                premium_tier: guild.premiumTier,
                region: guild.region,
                roles: guild.roles,
                vanity_url_code: guild.vanityUrlCode,
              },
              joinPosition: guild.members.sort((x, y) => x.joinedAtUnix - y.joinedAtUnix).findIndex((m) => m.id === userId) + 1,
              member: guild.members.get(userId),
              owner: guild.owner,
            };
          });
        }).flat().filter((v) => v);
      }, user.id);
      results = chunks.flat().filter((v) => v).sort((x, y) => {
        return (+x.guild.id) - +(y.guild.id);
      }).map((result) => {
        result.guild = new Structures.Guild(context.client, result.guild);
        result.member = new Structures.Member(context.client, result.member);
        result.owner = new Structures.User(context.client, result.owner);
        return result;
      });
    } else {
      // search local cache? shouldnt ever be used tho
      results = [];
    }
  } else {
    results = [];
  }
  return {results, user};
}


export const COMMAND_ID = 'seenon';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { results, user } = args.payload;

  const pageLimit = results.length || 1;

  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const embed = new Embed();
      embed.setAuthor(user.toString(), user.avatarUrlFormat(null, {size: 1024}), user.jumpLink);
      embed.setColor(Colors.BLURPLE);

      const resultNumber = page - 1;
      if (resultNumber in results) {
        const { guild, joinPosition, member, owner } = results[resultNumber];

        if (guild.description) {
          embed.setDescription(guild.description);
        }

        if (guild.icon) {
          embed.setThumbnail(<string> guild.iconUrlFormat(null, {size: 1024}));
        }

        embed.setTitle(guild.name);
        {
          const description: Array<string> = [];
          description.push(translate('owner_seenon.acronym', {acronym: guild.acronym}));
          {
            const timestamp = createTimestampMomentFromGuild(guild.createdAtUnix, context.guildId);
            description.push(translate('owner_seenon.created', {timestamp: timestamp.locale(language).fromNow()}));
            description.push(`**->** ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`);
          }
          description.push(translate('owner_seenon.id', {guild: guild.id}));
          description.push(translate('owner_seenon.join_position', {joinPosition: joinPosition.toLocaleString(language), memberCount: guild.memberCount.toLocaleString(language)}));
          description.push(translate('owner_seenon.locale', {preferredLocale: guild.preferredLocaleText || guild.preferredLocale}));
          description.push(translate('owner_seenon.nitro_boosts', {premiumSubscriptionCount: guild.premiumSubscriptionCount.toLocaleString(language)}));
          description.push(translate('owner_seenon.nitro_tier', {premiumTier: (guild.premiumTier) ? translate('info.guild.nitro_level', {level: guild.premiumTier}) : translate('common.none')}));
          if (guild.id === context.guildId) {
            description.push(translate('owner_seenon.owner', {ownerId: guild.ownerId}));
          } else {
            description.push(translate('owner_seenon.owner_2', {owner: owner}));
            description.push(translate('owner_seenon.owner_id', {owner: owner.id}));
          }
          description.push(translate('owner_seenon.region', {region: guild.region}));
          description.push(translate('owner_seenon.server_type', {isPublic: (guild.isPublic) ? translate('info.guild.server_type_public') : translate('info.guild.server_type_private')}));

          if (context.client.shardCount !== 1) {
            description.push(translate('owner_seenon.shard', {guildIdToShardId: guildIdToShardId(guild.id, context.client.shardCount), shardCount: context.client.shardCount}));
          }

          if (guild.vanityUrlCode) {
            description.push(translate('owner_seenon.vanity', {Invite: Endpoints.Invite.SHORT(guild.vanityUrlCode)})); 
          }
          embed.addField(translate('owner_seenon.information'), description.join('\n'), true);
        }
      }
      embed.setFooter(translate('owner_seenon.guild_of', {page: page, pageLimit: pageLimit}));

      return embed;
    },
  });
  return await paginator.start();
}

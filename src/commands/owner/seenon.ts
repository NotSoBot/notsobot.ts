import { ClusterClient, Command, CommandClient, Structures } from 'detritus-client';
import { Colors, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup, guildIdToShardId } from 'detritus-client/lib/utils';

import { Endpoints } from 'detritus-client-rest';

import { CommandTypes, DateOptions } from '../../constants';
import { DefaultParameters, Paginator, Parameters, editOrReply, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


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

const findMemberOrUser = Parameters.memberOrUser();
async function getSharedGuilds(value: string, context: Command.Context): Promise<SharedGuildPayload> {
  // value will be our userId if they didnt send anything in
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


export const COMMAND_NAME = 'seenon';

export default class SeenOnCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: (context: Command.Context) => context.userId,
      label: 'payload',
      metadata: {
        description: 'Get guilds a user shares with NotSoBot',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} cake#1`,
          `${COMMAND_NAME} <@439205512425504771>`,
        ],
        type: CommandTypes.OWNER,
        usage: '?<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: getSharedGuilds,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload.user && !args.payload.user.bot && !!args.payload.results.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.payload.user) {
      return editOrReply(context, '⚠ Unable to find that user.');
    } else if (args.payload.user.bot) {
      return editOrReply(context, '⚠ Bots cannot be used with this command.');
    }
    return editOrReply(context, '⚠ User shares no guilds.');
  }

  async run(context: Command.Context, args: CommandArgs) {
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
            description.push(`**Acronym**: ${guild.acronym}`);
            description.push(`**Created**: ${guild.createdAt.toLocaleString('en-US', DateOptions)}`);
            description.push(`**Id**: \`${guild.id}\``);
            description.push(`**Join Position**: ${joinPosition.toLocaleString()}/${guild.memberCount.toLocaleString()}`);
            description.push(`**Locale**: \`${guild.preferredLocaleText || guild.preferredLocale}\``);
            description.push(`**Nitro Boosts**: ${guild.premiumSubscriptionCount.toLocaleString()}`);
            description.push(`**Nitro Tier**: ${(guild.premiumTier) ? `Level ${guild.premiumTier}` : 'None'}`);
            if (guild.id === context.guildId) {
              description.push(`**Owner**: <@!${guild.ownerId}>`);
            } else {
              description.push(`**Owner**: ${owner}`);
              description.push(`**Owner Id**: \`${owner.id}\``);
            }
            description.push(`**Region**: \`${guild.region}\``);
            description.push(`**Server Type**: ${(guild.isPublic) ? 'Public' : 'Private'}`);

            if (context.shardCount !== 1) {
              description.push(`**Shard**: ${guildIdToShardId(guild.id, context.shardCount)}/${context.shardCount}`);
            }

            if (guild.vanityUrlCode) {
              description.push(`**Vanity**: ${Endpoints.Invite.SHORT(guild.vanityUrlCode)}`); 
            }
            embed.addField('Information', description.join('\n'), true);
          }
        }
        embed.setFooter(`Guild ${page} of ${pageLimit}`);

        return embed;
      },
    });
    return await paginator.start();
  }
}

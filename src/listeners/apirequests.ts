import { ClusterClient, Structures } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Listener } from './listener';

import {
  ApiEventsSpewer,
  ApiEventsSpewerEvents,
  ApiGatewayRequest,
  ApiGatewayRequestMethods,
} from '../apievents';
import { captureError } from '../sentry';
import { requestAllGuildMembers } from '../utils/tools';


// Answers what the api asks our cluster over its gateway (`ApiGatewayOpcodes.REQUEST`). The api only sends a request to
// the cluster holding the server's shard, and asks discord itself when we answer with an error code.

const SNOWFLAKE = /^[0-9]{1,20}$/;

// anyone logged into the dashboard can ask about any server, so loading members has to stay cheap:
//   - servers bigger than this only get the one member asked for (op 8 with their id), every member of one would stay
//     cached for good
//   - a server loaded in full isn't loaded again for a while, member events keep it up to date in between (it can stay
//     "not ready" when its member count drifts from what we have cached)
const FULL_LOAD_MAX_MEMBERS = 25000;
const FULL_LOAD_COOLDOWN = 10 * 60 * 1000;
const MEMBER_REQUEST_TIMEOUT = 10000;
// guild id -> when it was last loaded in full
const fullLoads = new Map<string, number>();


class ApiRequestError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}


export interface ApiGuildMemberResponse {
  icon: null | string,
  id: string,
  name: string,
  owner: boolean,
  // the base permissions (@everyone's and their roles'), like discord's `/users/@me/guilds`
  permissions: string,
}


function createGuildMemberResponse(guild: Structures.Guild, member: Structures.Member): ApiGuildMemberResponse {
  return {
    icon: guild.icon,
    id: guild.id,
    name: guild.name,
    owner: guild.ownerId === member.id,
    permissions: String(member.permissions),
  };
}


// the member's entry for the dashboard, null when they aren't in the server (or we aren't). a server we don't have every
// member of is loaded fully first, the same as username searches, so a missing member really isn't in it
async function fetchGuildMember(cluster: ClusterClient, data: any): Promise<ApiGuildMemberResponse | null> {
  const guildId = String((data) ? data.guild_id : '');
  const userId = String((data) ? data.user_id : '');
  if (!SNOWFLAKE.test(guildId) || !SNOWFLAKE.test(userId)) {
    throw new ApiRequestError('INVALID');
  }

  // the same math discord shards with
  const shardId = Number((BigInt(guildId) >> 22n) % BigInt(cluster.shardCount));
  const shard = cluster.shards.get(shardId);
  if (!shard || shard.gateway.state !== 'READY') {
    throw new ApiRequestError('UNAVAILABLE');
  }

  const guild = shard.guilds.get(guildId);
  if (!guild) {
    return null;
  }
  if (guild.unavailable) {
    throw new ApiRequestError('UNAVAILABLE');
  }

  let member = guild.members.get(userId);
  if (!member && !guild.isReady) {
    try {
      if (FULL_LOAD_MAX_MEMBERS < guild.memberCount) {
        // the types want a `query`, it isn't sent along with `userIds`
        await guild.requestMembers({presences: false, query: '', timeout: MEMBER_REQUEST_TIMEOUT, userIds: [userId]});
      } else {
        const loadedAt = fullLoads.get(guild.id);
        if (loadedAt === undefined || FULL_LOAD_COOLDOWN <= Date.now() - loadedAt) {
          await requestAllGuildMembers(guild);
          fullLoads.set(guild.id, Date.now());
        }
      }
    } catch(error) {
      throw new ApiRequestError('MEMBERS_TIMEOUT');
    }
    member = guild.members.get(userId);
  }
  if (!member) {
    return null;
  }
  return createGuildMemberResponse(guild, member);
}


// the dashboard's server list for someone who didn't let it read theirs from discord: every server on our shards we
// have them cached in. nothing is loaded for it, so it misses servers where we never saw them (the api says so)
function fetchUserGuilds(cluster: ClusterClient, data: any): {guilds: Array<ApiGuildMemberResponse>} {
  const userId = String((data) ? data.user_id : '');
  if (!SNOWFLAKE.test(userId)) {
    throw new ApiRequestError('INVALID');
  }

  const guilds: Array<ApiGuildMemberResponse> = [];
  for (let [shardId, shard] of cluster.shards) {
    for (let [guildId, guild] of shard.guilds) {
      const member = guild.members.get(userId);
      if (member && !guild.unavailable) {
        guilds.push(createGuildMemberResponse(guild, member));
      }
    }
  }
  return {guilds};
}


class ApiRequestsListener extends Listener {
  async handle(cluster: ClusterClient, apiEvents: ApiEventsSpewer, request: ApiGatewayRequest): Promise<void> {
    try {
      let data: any;
      switch (request.method) {
        case ApiGatewayRequestMethods.GUILD_MEMBER: {
          data = await fetchGuildMember(cluster, request.data);
        }; break;
        case ApiGatewayRequestMethods.USER_GUILDS: {
          data = fetchUserGuilds(cluster, request.data);
        }; break;
        default: {
          throw new ApiRequestError('UNKNOWN_METHOD');
        };
      }
      apiEvents.respond(request, data);
    } catch(error) {
      if (error instanceof ApiRequestError) {
        apiEvents.respond(request, null, error.code);
      } else {
        captureError(error, {tags: {'api_events.method': request.method, source: 'api_requests'}});
        apiEvents.respond(request, null, 'ERROR');
      }
    }
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = apiEvents.subscribe(ApiEventsSpewerEvents.REQUEST, (request: ApiGatewayRequest) => {
        this.handle(cluster, apiEvents, request);
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new ApiRequestsListener();

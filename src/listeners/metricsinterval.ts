import { monitorEventLoopDelay } from 'perf_hooks';

import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents, SocketStates } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { putInfoMetrics } from '../api';
import { getApiError } from '../api/errors';
import {
  INTERACTION_RESPONSE_BUCKETS,
  MetricsCounter,
  connectCommandMetrics,
  connectInteractionCommandMetrics,
  incrementCounter,
  observeHistogram,
  restoreMetricsChanges,
  takeMetricsChanges,
} from '../metrics';
import { RedisSpewer } from '../redis';


// the api expires a cluster's values after 90 seconds without a report
const REPORT_INTERVAL = 15 * 1000;

const PROCESS_START_TIME = Math.round(Date.now() / 1000 - process.uptime());

const DISCORD_EPOCH = 1420070400000n;
const INTERACTION_CALLBACK_ROUTE = '/interactions/:interactionId/:token/callback';

// module scope so a `.refresh -listeners` (which reloads this file and `../metrics`) hooks the clients up again
let hookedCommandClients = new WeakSet<object>();


class MetricsInterval extends Listener {
  eventLoopDelay = monitorEventLoopDelay({resolution: 20});
  interval = new Timers.Interval();
  reporting = false;

  // what this cluster looks like right now, the api replaces the cluster's last snapshot with it
  getSnapshot(cluster: ClusterClient): Array<MetricsCounter> {
    const values: Array<MetricsCounter> = [];
    const add = (name: string, value: number, labels: Record<string, string> = {}) => {
      values.push({labels, name, value});
    };

    const cpu = process.cpuUsage();
    const memory = process.memoryUsage();
    add('notsobot_process_cpu_seconds_total', (cpu.user + cpu.system) / 1e6);
    add('notsobot_process_start_time_seconds', PROCESS_START_TIME);
    add('notsobot_process_resident_memory_bytes', memory.rss);
    add('notsobot_process_heap_used_bytes', memory.heapUsed);
    add('notsobot_process_heap_total_bytes', memory.heapTotal);
    add('notsobot_process_external_memory_bytes', memory.external);

    const delay = this.eventLoopDelay;
    if (delay.count) {
      add('notsobot_process_eventloop_delay_seconds', delay.mean / 1e9, {stat: 'mean'});
      add('notsobot_process_eventloop_delay_seconds', delay.percentile(99) / 1e9, {stat: 'p99'});
      add('notsobot_process_eventloop_delay_seconds', delay.max / 1e9, {stat: 'max'});
    }

    for (let [shardId, shard] of cluster.shards) {
      const labels = {shard: String(shardId)};
      add('notsobot_shard_ready', +(shard.gateway.state === SocketStates.READY), labels);
      add('notsobot_shard_guilds', shard.guilds.length, labels);
      add('notsobot_shard_guild_members', shard.guilds.reduce((x, guild) => x + guild.memberCount, 0), labels);
      add('notsobot_shard_channels', shard.channels.length, labels);
      add('notsobot_shard_members', shard.members.length, labels);
      add('notsobot_shard_messages', shard.messages.length, labels);
      add('notsobot_shard_presences', shard.presences.length, labels);
      add('notsobot_shard_users', shard.users.length, labels);
      add('notsobot_shard_voice_states', shard.voiceStates.length, labels);

      // the last heartbeat's round trip, once it's been acknowledged (an internal of the gateway, so checked first,
      // a throw here would stop every report)
      const heartbeat = shard.gateway._heartbeat;
      if (heartbeat && heartbeat.lastAck && heartbeat.lastSent && heartbeat.lastSent <= heartbeat.lastAck) {
        add('notsobot_shard_gateway_latency_seconds', (heartbeat.lastAck - heartbeat.lastSent) / 1000, labels);
      }
    }
    return values;
  }

  // the command clients are made after the listeners connect, so they're hooked up once they exist
  hookCommandClients(cluster: ClusterClient): void {
    const { commandClient, interactionCommandClient } = cluster;
    if (commandClient && !hookedCommandClients.has(commandClient)) {
      hookedCommandClients.add(commandClient);
      this.subscriptions.push(...connectCommandMetrics(commandClient));
    }
    if (interactionCommandClient && !hookedCommandClients.has(interactionCommandClient)) {
      hookedCommandClients.add(interactionCommandClient);
      this.subscriptions.push(...connectInteractionCommandMetrics(interactionCommandClient));
    }
  }

  async report(cluster: ClusterClient): Promise<void> {
    this.hookCommandClients(cluster);

    const shard = cluster.shards.first();
    if (!shard || this.reporting) {
      return;
    }
    this.reporting = true;

    const changes = takeMetricsChanges();
    try {
      await putInfoMetrics({client: shard}, {
        clusterId: (cluster.manager) ? cluster.manager.clusterId : 0,
        histograms: changes.histograms,
        samples: [...changes.counters, ...this.getSnapshot(cluster)],
      });
      // the event loop delay covers the time since the last report that made it
      this.eventLoopDelay.reset();
    } catch(error) {
      if (error && error.response && error.response.statusCode < 500) {
        // the api rejected the report itself (a metric it doesn't know, wrong labels), sending it again won't help
        const body = await getApiError(error);
        console.error('Metrics report rejected', (body) ? body.message : error);
      } else {
        // the api is unreachable or erroring, keep the changes for the next report
        restoreMetricsChanges(changes);
      }
    } finally {
      this.reporting = false;
    }
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    subscriptions.push(cluster.subscribe(ClientEvents.REST_RESPONSE, ({response}) => {
      const route = response.request.route;
      if (route) {
        incrementCounter('notsobot_rest_responses_total', {
          method: response.request.method,
          route: route.path,
          status: String(response.statusCode),
        });

        // how long after the interaction was made discord got our response, from the id's timestamp
        if (route.path === INTERACTION_CALLBACK_ROUTE && route.params && route.params.interactionId) {
          try {
            const created = Number((BigInt(route.params.interactionId) >> 22n) + DISCORD_EPOCH);
            observeHistogram('notsobot_interaction_response_seconds', {}, INTERACTION_RESPONSE_BUCKETS, (Date.now() - created) / 1000);
          } catch(error) {

          }
        }
      }
    }));

    const connectShard = (shard: ShardClient) => {
      subscriptions.push(shard.gateway.subscribe('packet', (packet: {t?: string | null}) => {
        if (packet.t) {
          incrementCounter('notsobot_gateway_events_total', {event: packet.t});
        }
      }));
      subscriptions.push(shard.gateway.subscribe('close', ({code}: {code: number}) => {
        incrementCounter('notsobot_gateway_closes_total', {code: String(code)});
      }));
      subscriptions.push(shard.gateway.subscribe('state', ({state}: {state: string}) => {
        incrementCounter('notsobot_gateway_state_changes_total', {state});
      }));
    };
    if (cluster.shards.length) {
      for (let [shardId, shard] of cluster.shards) {
        connectShard(shard);
      }
    } else {
      subscriptions.push(cluster.subscribe(ClientEvents.SHARD, ({shard}) => connectShard(shard)));
    }

    this.eventLoopDelay.enable();
    this.interval.start(REPORT_INTERVAL, () => this.report(cluster));
    // usually not made yet on startup, but they are on a refresh
    this.hookCommandClients(cluster);

    return subscriptions;
  }

  stop(cluster: ClusterClient | ShardClient) {
    // the command client subscriptions are in `this.subscriptions`, removed below
    hookedCommandClients = new WeakSet();
    super.stop(cluster);
    this.interval.stop();
    this.eventLoopDelay.disable();
  }
}

export default new MetricsInterval();

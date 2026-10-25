import { CommandClient, InteractionCommandClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { getRunErrorResult } from './commandresults';


// what changed since this cluster's last metrics report, `listeners/metricsinterval.ts` sends it to the api every so
// often and the api adds every cluster's up for prometheus
// the names, labels and buckets have to match notsobot.api's `utilities/tools/metrics.py`, it rejects anything else

export const COMMAND_DURATION_BUCKETS = [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60];
// discord gives an interaction 3 seconds to get a response
export const INTERACTION_RESPONSE_BUCKETS = [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 5, 10];
export const API_REQUEST_DURATION_BUCKETS = [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60];
export const REST_REQUEST_DURATION_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
export const REST_WAIT_BUCKETS = [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10, 30, 60];

export interface MetricsCounter {
  labels: Record<string, string>,
  name: string,
  value: number,
}

export interface MetricsHistogram {
  // how many observations landed in each bucket, not cumulative, the last one is +Inf
  counts: Array<number>,
  labels: Record<string, string>,
  name: string,
  sum: number,
}

export interface MetricsChanges {
  counters: Array<MetricsCounter>,
  histograms: Array<MetricsHistogram>,
}

// kept on the process instead of this module, so code a `.refresh` doesn't reload (bot.ts' handlers) and the reloaded
// listener still share one set of counters
const state: {counters: Map<string, MetricsCounter>, histograms: Map<string, MetricsHistogram>} =
  (globalThis as any).notsobotMetricsState = (globalThis as any).notsobotMetricsState || {counters: new Map(), histograms: new Map()};
const { counters, histograms } = state;


function getKey(name: string, labels: Record<string, string>): string {
  return name + JSON.stringify(labels);
}

export function incrementCounter(name: string, labels: Record<string, string>, value: number = 1): void {
  const key = getKey(name, labels);
  let counter = counters.get(key);
  if (!counter) {
    counter = {labels, name, value: 0};
    counters.set(key, counter);
  }
  counter.value += value;
}

export function observeHistogram(name: string, labels: Record<string, string>, buckets: Array<number>, value: number): void {
  const key = getKey(name, labels);
  let histogram = histograms.get(key);
  if (!histogram) {
    histogram = {counts: new Array(buckets.length + 1).fill(0), labels, name, sum: 0};
    histograms.set(key, histogram);
  }
  const index = buckets.findIndex((bucket) => value <= bucket);
  histogram.counts[(index === -1) ? buckets.length : index]++;
  histogram.sum += value;
}

// hands over everything since the last report and starts over
export function takeMetricsChanges(): MetricsChanges {
  const changes = {counters: Array.from(counters.values()), histograms: Array.from(histograms.values())};
  counters.clear();
  histograms.clear();
  return changes;
}

// puts back a report that didn't make it to the api, so the next one includes it
export function restoreMetricsChanges(changes: MetricsChanges): void {
  for (let counter of changes.counters) {
    incrementCounter(counter.name, counter.labels, counter.value);
  }
  for (let { counts, labels, name, sum } of changes.histograms) {
    const key = getKey(name, labels);
    const histogram = histograms.get(key);
    if (histogram) {
      counts.forEach((count, i) => histogram.counts[i] += count);
      histogram.sum += sum;
    } else {
      histograms.set(key, {counts, labels, name, sum});
    }
  }
}


// the bot's requests to the notsobot api (`api/raw.ts`), `status` is the status class or `error` without a response
export function recordApiRequest(route: string, status: string, started: number): void {
  const seconds = (Date.now() - started) / 1000;
  incrementCounter('notsobot_api_requests_total', {route, status});
  incrementCounter('notsobot_api_request_seconds_total', {route}, seconds);
  observeHistogram('notsobot_api_request_duration_seconds', {}, API_REQUEST_DURATION_BUCKETS, seconds);
}

// every request that went out to discord's rest api (ratelimit retries included), `status` is the status code or `error`
// without a response (timed out, connection reset). `took` is until discord's headers came back
export function recordRestRequest(method: string, route: string, status: string, took?: number): void {
  incrementCounter('notsobot_rest_responses_total', {method, route, status});
  if (took !== undefined) {
    const seconds = took / 1000;
    incrementCounter('notsobot_rest_request_seconds_total', {method, route}, seconds);
    observeHistogram('notsobot_rest_request_duration_seconds', {}, REST_REQUEST_DURATION_BUCKETS, seconds);
  }
}

// how long a request waited before going out, from being made (or its last attempt) to being sent. ratelimit buckets,
// 429 retries and the 502 retry delay, recorded for every attempt so the average per route is over all of them
export function recordRestWait(method: string, route: string, waited: number): void {
  const seconds = waited / 1000;
  incrementCounter('notsobot_rest_wait_seconds_total', {method, route}, seconds);
  observeHistogram('notsobot_rest_wait_duration_seconds', {}, REST_WAIT_BUCKETS, seconds);
}


// only overall rates by type and result, per command usage goes to clickhouse through the api's command use tracking
function recordCommand(type: string, result: string, started?: number): void {
  incrementCounter('notsobot_commands_total', {type, result});
  if (started) {
    observeHistogram('notsobot_command_duration_seconds', {type}, COMMAND_DURATION_BUCKETS, (Date.now() - started) / 1000);
  }
}

// `started` is set by the clients' `onCommandCheck`. the metrics listener hooks these up (and removes them on a refresh)
export function connectCommandMetrics(commandClient: CommandClient): Array<EventSubscription> {
  const type = 'prefixed';
  return [
    commandClient.subscribe(ClientEvents.COMMAND_RAN, ({context}) => {
      recordCommand(type, 'ran', context.metadata && context.metadata.started);
    }),
    commandClient.subscribe(ClientEvents.COMMAND_RUN_ERROR, ({context, error}) => {
      recordCommand(type, getRunErrorResult(error), context.metadata && context.metadata.started);
    }),
    commandClient.subscribe(ClientEvents.COMMAND_FAIL, () => recordCommand(type, 'fail')),
    commandClient.subscribe(ClientEvents.COMMAND_RATELIMIT, () => recordCommand(type, 'ratelimited')),
  ];
}

export function connectInteractionCommandMetrics(interactionClient: InteractionCommandClient): Array<EventSubscription> {
  const type = 'interaction';
  return [
    interactionClient.subscribe(ClientEvents.COMMAND_RAN, ({context}) => {
      recordCommand(type, 'ran', context.metadata && context.metadata.started);
    }),
    interactionClient.subscribe(ClientEvents.COMMAND_RUN_ERROR, ({context, error}) => {
      recordCommand(type, getRunErrorResult(error), context.metadata && context.metadata.started);
    }),
    interactionClient.subscribe(ClientEvents.COMMAND_FAIL, () => recordCommand(type, 'fail')),
    interactionClient.subscribe(ClientEvents.COMMAND_RATELIMIT, () => recordCommand(type, 'ratelimited')),
  ];
}

import { ClusterClient, Command, Interaction, ShardClient } from 'detritus-client';

import { DIRECTORY } from '../../../../config.json';

import { NotSoCommandClient } from '../../../commandclient';
import { NotSoInteractionClient } from '../../../interactioncommandclient';
import { displayReply } from '../../../utils';


async function refreshCommands(
  cluster: ClusterClient,
  refreshListeners: boolean,
  refreshStores: boolean,
  LIB_PATH: string,
  extras: Record<string, any>,
): Promise<Array<number> | RefreshFailure> {
  const LISTENERS_PATH = '/listeners/';
  const STORE_PATH = '/stores/';

  // the api events module holds this process' connection, reloading it would leave the old one running
  const IGNORE = ['/apievents.', '/bot.'];

  const errors: Array<string> = [];
  let dump: Record<string, any> | null = null;
  const isListenerOrStore = (key: string) => key.includes(LISTENERS_PATH) || key.includes(STORE_PATH);

  // first pass: clear every non-listener/store module so the listeners/stores reloaded below pick up fresh dependencies
  for (let key of Object.keys(require.cache)) {
    if (!key.includes(LIB_PATH)) {
      continue;
    }
    if (IGNORE.some((file) => key.includes(file))) {
      continue;
    }

    if (!isListenerOrStore(key)) {
      delete require.cache[key];
    }
  }

  // second pass: hot-swap the listener/store methods onto the existing (connected) objects
  for (let key of Object.keys(require.cache)) {
    if (!key.includes(LIB_PATH) || !isListenerOrStore(key)) {
      continue;
    }
    if (key.includes(LISTENERS_PATH)) {
      if (!refreshListeners) {
        continue;
      }
    } else if (!refreshStores) {
      continue;
    }

    const oldCache = require.cache[key];
    const oldModule = oldCache && oldCache.exports;
    if (!oldModule || !oldModule.default) {
      // do nothing since it's just /index.ts and /store.ts
      continue;
    }

    // get the old object and stop it
    const { default: oldObject } = oldModule;
    oldObject.stop(cluster);

    try {
      // delete old module and re-fetch the new object
      delete require.cache[key];
      const newModule = require(key);
      const newObject = newModule && newModule.default;
      if (!newObject) {
        throw new Error('missing default export');
      }

      // set the old object's functions to the new object's
      for (let name of Object.getOwnPropertyNames(newObject.constructor.prototype)) {
        if (name !== 'constructor' && typeof(newObject[name]) === 'function') {
          oldObject[name] = newObject.constructor.prototype[name].bind(oldObject);
        }
      }
    } catch(error) {
      errors.push(`${key.slice(key.indexOf(LIB_PATH) + LIB_PATH.length)}: ${(error as any).message}`);
    } finally {
      // set the cache back to the old module and reconnect it, even if the reload failed
      require.cache[key] = oldCache;
      oldObject.connect(cluster);
    }
  }

  if (cluster.commandClient) {
    const commandClient = cluster.commandClient as NotSoCommandClient;
    try {
      await commandClient.resetCommands();
    } catch(error) {
      errors.push(`commands: ${(error as any).message}`);
    }
  }
  if (cluster.interactionCommandClient) {
    const interactionCommandClient = cluster.interactionCommandClient as NotSoInteractionClient;
    try {
      await interactionCommandClient.resetCommands();
    } catch(error) {
      // everything below has to stay inline, this function is sent to the other clusters as source code
      const describe = async (e: any): Promise<string> => {
        if (!e || typeof(e) !== 'object') {
          return String(e);
        }
        let text = e.message || JSON.stringify(e);
        if (e.raw) {
          // discord's parsed response body, has the field errors if discord gave any
          text += ` ${JSON.stringify(e.raw)}`;
        } else if (e.response) {
          try {
            text += ` ${await e.response.text()}`;
          } catch {}
        }
        return text;
      };

      let message = await describe(error);
      // say which commands are too big instead of just their index
      const oversized = interactionCommandClient.getOversizedCommands();
      if (oversized.length) {
        const text = oversized.map((x) => `/${x.name} (#${x.index}, ${x.size.toLocaleString()} characters)`).join(', ');
        message += ` [too big: ${text}]`;
      }
      errors.push(`interaction commands: ${message}`);

      dump = {clusterId: cluster.clusterId, error: message, badStrings: [], oversized: [], results: []};
      dump.oversized = interactionCommandClient.getOversizedCommands();

      // lone surrogates/control characters make discord reject the whole body with a bare 400 (code 0)
      const badText = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
      const walk = (value: any, path: string) => {
        if (typeof(value) === 'string') {
          if (badText.test(value)) {
            dump!.badStrings.push(`${path}: ${JSON.stringify(value)}`);
          }
        } else if (value && typeof(value) === 'object') {
          for (let key in value) {
            walk(value[key], `${path}.${key}`);
          }
        }
      };
      const payload: Array<any> = interactionCommandClient.commands.map((command) => {
        return interactionCommandClient.createApplicationCommandPayload(command).toJSON();
      });
      for (let raw of payload) {
        walk(raw, raw.name);
      }

      // retry the changes one at a time so the bad command gets named along with discord's response
      // deletes are only listed, the next successful refresh removes them
      try {
        const remote = await interactionCommandClient.fetchApplicationCommands();
        interactionCommandClient.fillCommandIds(remote);
        const plan = interactionCommandClient.planApplicationCommands(remote);
        dump.plan = {
          create: plan.create.map((command) => command.name),
          delete: plan.delete.map((command) => command.name),
          edit: plan.edit.map((x) => ({name: x.local.name, differences: x.differences})),
        };

        const shard = cluster.shards.first()!;
        const applicationId = cluster.applicationId;
        for (let command of plan.create) {
          try {
            await shard.rest.createApplicationCommand(applicationId, interactionCommandClient.createApplicationCommandPayload(command) as any);
            dump.results.push(`create /${command.name}: ok`);
          } catch(e) {
            dump.results.push(`create /${command.name}: ${await describe(e)}`);
          }
        }
        for (let { local, remote: remoteCommand } of plan.edit) {
          try {
            await shard.rest.editApplicationCommand(applicationId, remoteCommand.id, interactionCommandClient.createApplicationCommandPayload(local) as any);
            dump.results.push(`edit /${local.name}: ok`);
          } catch(e) {
            dump.results.push(`edit /${local.name}: ${await describe(e)}`);
          }
        }
      } catch(e) {
        dump.planError = await describe(e);
      }
      dump.payloadBytes = Buffer.byteLength(JSON.stringify(payload));
      dump.payload = payload;
    }
  }

  // thrown errors lose everything but their message over ipc, so return the dump instead
  if (dump) {
    console.error('Refresh errors', errors);
    return {clusterId: cluster.clusterId, error: `Cluster ${cluster.clusterId}: ${errors.join(', ')}`, dump};
  }
  if (errors.length) {
    console.error('Refresh errors', errors);
    throw new Error(`Cluster ${cluster.clusterId}: ${errors.join(', ')}`);
  }
  return cluster.shards.map((shard: ShardClient) => shard.shardId);
}

export interface RefreshFailure {
  clusterId: number,
  dump: Record<string, any>,
  error: string,
}

export interface CommandArgs {
  listeners: boolean,
  stores: boolean,
}


export const COMMAND_ID = 'refresh';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  if (!context.manager) {
    return displayReply(context, {description: 'no cluster manager found'});
  }
  await displayReply(context, {description: 'ok, refreshing...'});
  const shardIds = await context.manager.broadcastEval(refreshCommands, args.listeners, args.stores, DIRECTORY);
    /*
  {
    redisChannels: Object.values(RedisChannels),
  });
  */

  const failures = shardIds.filter((x: any) => x && !Array.isArray(x) && !(x instanceof Error) && x.dump) as Array<RefreshFailure>;
  if (failures.length) {
    const results = failures.flatMap((x) => (x.dump.results || []).filter((r: string) => !r.endsWith(': ok')));
    const badStrings = failures.flatMap((x) => x.dump.badStrings || []);
    const description = [
      ...failures.map((x) => `Error: ${x.error}`),
      ...badStrings.slice(0, 5).map((x: string) => `bad text: \`${x.slice(0, 200)}\``),
      ...results.slice(0, 5).map((x: string) => `\`${x.slice(0, 300)}\``),
    ].join('\n');
    return displayReply(context, {
      description: description.slice(0, 4000),
      files: [{filename: 'refresh-dump.json', value: JSON.stringify(failures.map((x) => x.dump), null, 2)}],
    });
  }

  const error = shardIds.find((shardId: any) => shardId instanceof Error) as any;
  if (error) {
    if (error.errors) {
      return displayReply(context, {description: `${error.message} (${JSON.stringify(error.errors)})`});
    }
    console.log(error);
    return displayReply(context, {description: `Error: ${error.message}`});
  }
  return displayReply(context, {description: `ok, refreshed commands on ${shardIds.flat().length} shards.`});
}

import { NotSoClient } from './client';


const bot = new NotSoClient({
  activateOnEdits: true,
  directory: './commands',
  mentionsEnabled: false,
  prefix: '..',
  rest: {
    onNotOkResponse: (response) => {
      console.log(response.request.route, response.headers);
    },
  },
});

bot.on('COMMAND_RATELIMIT', async ({command, context, ratelimit, remaining}) => {
  if (!ratelimit.replied) {
    if (context.message.canReply) {
      ratelimit.replied = true;
      setTimeout(() => {
        ratelimit.replied = false;
      }, remaining / 2);

      let noun = 'You';
      if (command.ratelimit) {
        switch (command.ratelimit.type) {
          case 'channel':
          case 'guild': {
            noun = "Y'all";
          }; break;
        }
      }
      try {
        await context.reply(`${noun} are using ${command.name} too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`);
      } catch(e) {
        ratelimit.replied = false;
      }
    }
  }
});

(async () => {
  const cluster = await bot.run();
  process.title = `C: ${cluster.manager.clusterId}, S:(${cluster.shardStart}-${cluster.shardEnd})`;

  for (let [shardId, shard] of cluster.shards) {
    shard.gateway.on('state', ({state}: {state: string}) => {
      console.log(`Shard #${shardId} - ${state}`);
    });
  }
  console.log(`Shards #(${cluster.shards.map((s: any, id: number) => id).join(', ')}) loaded`);
})();

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
  const cluster = bot.client;
  process.title = `C: ${cluster.manager.clusterId}, S:(${cluster.shardStart}-${cluster.shardEnd})`;

  cluster.on('shard', ({shard}) => {
    const shardId = shard.shardId;
    console.log(`Loading up ${shardId}...`);
    shard.gateway.on('state', ({state}) => {
      console.log(`Shard #${shardId} - ${state}`);
    });
    shard.gateway.on('close', ({code, reason}) => {
      console.log(`Shard #${shardId} closed - ${code}, ${reason}`);
    });

    const now = Date.now();
    const send = <any> shard.gateway.send;
    shard.gateway.send = function () {
      console.log(Date.now() - now, 'SEND', ...arguments);
      return send.call(shard.gateway, ...arguments);
    };
    shard.gateway.on('packet', (packet) => {
      console.log(Date.now() - now, 'RECEIVED', packet.s, packet.op, packet.t);
    });
  });

  await bot.run();
  console.log(`Shards #(${cluster.shards.map((s: any, id: number) => id).join(', ')}) loaded`);
})();

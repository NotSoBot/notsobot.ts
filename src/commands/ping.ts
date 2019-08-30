import { Command } from 'detritus-client';


export default (<Command.CommandOptions> {
  name: 'ping',
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  run: async (context) => {
    const {gateway, rest} = await context.client.ping();
    return context.editOrReply(`pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
  },
  onRunError: (context, args, error) => {
    return context.editOrReply(`⚠ Error: ${error.message}`);
  },
});

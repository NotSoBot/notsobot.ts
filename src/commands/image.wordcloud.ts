import { Command } from 'detritus-client';


export default (<Command.CommandOptions> {
  name: 'worldcloud',
  aliases: ['wc'],
  ratelimit: {
    duration: 5000,
    limit: 2,
    type: 'channel',
  },
  run: async (context) => {

  },
});

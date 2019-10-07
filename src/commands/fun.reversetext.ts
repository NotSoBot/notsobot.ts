import { Command } from 'detritus-client';


export default (<Command.CommandOptions> {
  name: 'reversetext',
  aliases: ['reverse', 'r'],
  label: 'text',
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  run: async (context) => {

  },
});

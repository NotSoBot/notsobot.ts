import { Command } from 'detritus-client';


export default (<Command.CommandOptions> {
  name: 'triggered3',
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  run: async (context) => {

  },
});

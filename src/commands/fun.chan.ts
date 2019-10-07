import {Command} from 'detritus-client';


export default (<Command.CommandOptions> {
  name: 'chan',
  aliases: ['4chan', 'board', 'b'],
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  args: [
    {name: 'thread'}
  ],
  metadata: {
    examples: [
        'chan g',
        'chan g -thread 13371337'
    ]
  },

  run: async (context) => {

  },
});
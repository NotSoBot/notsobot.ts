import { Command, Structures } from 'detritus-client';

import { Parameters } from '../utils';


export default (<Command.CommandOptions> {
  name: 'user',
  aliases: ['member'],
  type: Parameters.memberOrUser,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to embed information in this channel.'),
  onBeforeRun: (context, args) => args.user,
  onCancelRun: (context) => context.reply('⚠ Unable to find that guy.'),
  run: async (context, args) => {
    const user = <Structures.User> args.user;

    await context.reply({
      embed: {
        description: JSON.stringify(args.user),
        fields: [],
        thumbnail: {
          url: user.avatarUrlFormat(null, {size: 1024}),
        },
      },
    });
  },
  onError: (context, args, error) => {
    console.error(error);
  },
});

import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'upload-commands',
  metadata: {
    description: 'Upload the bot\'s command information to the website',
    examples: ['upload-commands'],
    type: CommandTypes.OWNER,
    usage: 'upload-commands',
  },
  onBefore: (context) => context.user.isClientOwner,
  run: async (context) => {
    const commands = context.commandClient.commands.filter((command) => {
      return !!command.metadata && !!command.metadata.type;
    }).map((command) => {
      const { args } = command.args;
      const metadata = command.metadata;
      return {
        aliases: command.aliases,
        args: args.map((arg) => {
          return {
            aliases: arg.aliases,
            name: arg.name,
            prefixes: Array.from(arg.prefixes),
          };
        }),
        description: metadata.description || null,
        disableDm: command.disableDm,
        examples: metadata.examples,
        name: command.name,
        ratelimits: command.ratelimits.map((ratelimit) => {
          return {
            duration: ratelimit.duration,
            limit: ratelimit.limit,
            type: ratelimit.type,
          };
        }),
        type: metadata.type,
        usage: metadata.usage,
      };
    });

    const data = JSON.stringify(commands, null, 2);
    const upload = await context.rest.request({
      files: [{data, filename: 'commands.json', name: 'file'}],
      method: 'post',
      url: 'https://api.files.gg/files',
    });

    return context.editOrReply(upload.urls.main);
  },
  onError: (context, args, error) => console.error(error),
  onRunError,
});

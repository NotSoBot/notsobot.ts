import { Command } from 'detritus-client';

import { uploadCommands } from '../../api';
import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export default class UploadCommandsCommand extends BaseCommand {
  name = 'upload-commands';

  metadata = {
    description: 'Upload the bot\'s command information to the website',
    examples: ['upload-commands'],
    type: CommandTypes.OWNER,
    usage: 'upload-commands',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {
    const commands = context.commandClient.commands.filter((command) => {
      return !!command.metadata && !!command.metadata.type;
    }).map((command) => {
      const { args } = command.args;
      const metadata = command.metadata;

      const names = command.names;
      const name = <string> names.shift();
      return {
        aliases: names,
        args: args.map((arg) => {
          const argMetadata = arg.metadata || {};
          return {
            aliases: arg.aliases,
            description: argMetadata.description || '',
            name: arg.name,
            prefix: Array.from(arg.prefixes).shift() || '',
          };
        }),
        enabled: true,
        description: metadata.description || '',
        dmable: !command.disableDm,
        examples: metadata.examples,
        name,
        nsfw: !!metadata.nsfw,
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
    await uploadCommands(context, {commands});

    return context.editOrReply('ok');
  }
}

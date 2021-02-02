import { Command, CommandClient } from 'detritus-client';

import { uploadCommands } from '../../api';
import { CommandTypes } from '../../constants';
import { editOrReply } from '../../utils';

import { BaseCommand, CommandMetadata } from '../basecommand';


export const COMMAND_NAME = 'upload-commands';

export default class UploadCommandsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Upload the bot\'s command information to the website',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.OWNER,
        usage: `${COMMAND_NAME}`,
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {
    const commands = context.commandClient.commands.filter((command) => {
      return !!command.metadata && !!command.metadata.type;
    }).map((command) => {
      const { args } = command.argParser;
      const metadata = command.metadata as CommandMetadata;

      const names = [...command.names];
      let name: string;
      if (command.arg.prefixes.size) {
        name = names.shift() as string;
      } else {
        name = command.name;
        for (let i = 0; i < names.length; i++) {
          if (names[i] === name) {
            names.splice(i, 1);
            break;
          }
        }
      }
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
        examples: metadata.examples || [],
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
        usage: metadata.usage || '',
      };
    });
    await uploadCommands(context, {commands});

    return editOrReply(context, 'ok');
  }
}

import { Command, CommandClient, Interaction } from 'detritus-client';
import { ApplicationCommandTypes } from 'detritus-client/lib/constants';

import { uploadCommands } from '../../../api';
import { CommandCategories, CommandTypes } from '../../../constants';
import { editOrReply } from '../../../utils';

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
        category: CommandCategories.OWNER,
        usage: '',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {
    const commands: Array<any> = [];
    for (let command of context.commandClient.commands) {
      if (!command.metadata || !command.metadata.category) {
        continue;
      }

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
      commands.push({
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
        category: metadata.category,
        enabled: true,
        description: metadata.description || '',
        dmable: !command.disableDm,
        examples: metadata.examples || [],
        id: metadata.id || name.split(' ').join('.'),
        name,
        nsfw: !!metadata.nsfw,
        ratelimits: command.ratelimits.map((ratelimit) => {
          return {
            duration: ratelimit.duration,
            key: ratelimit.key,
            limit: ratelimit.limit,
            type: String(ratelimit.type),
          };
        }),
        type: CommandTypes.PREFIXED,
        usage: metadata.usage || '',
      });
    }
    if (context.interactionCommandClient) {
      const invokers: Array<[Interaction.InteractionCommand, Interaction.InteractionCommand | Interaction.InteractionCommandOption]> = [];
      for (let command of context.interactionCommandClient.commands) {
        if (command._options && command.isGroup) {
          for (let [x, option] of command._options) {
            if (option._options && option.isSubCommandGroup) {
              for (let [y, opt] of option._options) {
                if (opt.isSubCommand) {
                  invokers.push([command, opt]);
                }
              }
            } else if (option.isSubCommand) {
              invokers.push([command, option]);
            }
          }
        } else {
          invokers.push([command, command]);
        }
      }
      for (let [command, invoker] of invokers) {
        if (!invoker.metadata) {
          continue;
        }

        let commandType: number;
        switch (command.type) {
          case ApplicationCommandTypes.CHAT_INPUT: commandType = CommandTypes.APPLICATION_SLASH; break;
          case ApplicationCommandTypes.MESSAGE: commandType = CommandTypes.APPLICATION_MENU_MESSAGE; break;
          case ApplicationCommandTypes.USER: commandType = CommandTypes.APPLICATION_MENU_USER; break;
          default: continue;
        }

        // add in args
        commands.push({
          args: [],
          category: '',
          enabled: true,
          description: invoker.description,
          dmable: !invoker.disableDm,
          id: invoker.metadata.id || invoker.fullName.split(' ').join('.'),
          name: invoker.fullName,
          ratelimits: invoker.ratelimits?.map((ratelimit) => {
            return {
              duration: ratelimit.duration,
              key: ratelimit.key,
              limit: ratelimit.limit,
              type: String(ratelimit.type),
            };
          }),
          type: commandType,
          usage: '',
        });
      }
    }
    await uploadCommands(context, {commands});

    return editOrReply(context, 'ok');
  }
}

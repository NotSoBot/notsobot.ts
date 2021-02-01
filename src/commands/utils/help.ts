import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes } from '../../constants';
import { Paginator, createUserEmbed, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  commands: Array<Command.Command> | null,
}

export interface CommandArgs {
  commands: Array<Command.Command>,
}

export interface CommandMetadata {
  description: string,
  examples?: Array<string>,
  nsfw?: boolean,
  type: CommandTypes,
  usage: string,
}


export const COMMAND_NAME = 'help';

export default class HelpCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'commands',
      metadata: {
        description: 'Help!',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} google`,
          `${COMMAND_NAME} loggers`,
        ],
        type: CommandTypes.UTILS,
        usage: `${COMMAND_NAME} ?<command:name>`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: (content: string, context: Command.Context) => {
        if (content) {
          const commands: Array<Command.Command> = [];
    
          const insensitive = content.toLowerCase().replace(/\s\s+/g, ' ');
          for (let command of context.commandClient.commands) {
            for (let name of command.names) {
              if (name.startsWith(insensitive)) {
                commands.push(command);
                break;
              }
            }
          }
          return commands.sort((x, y) => {
            return x.name.localeCompare(y.name);
          });
        }
        return null;
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.commands && !!args.commands.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.commands) {
      return context.editOrReply('⚠ Unknown Command');
    }
    return context.editOrReply(`${context.user.mention}, this is our rewrite bot. <https://beta.notsobot.com/commands> (We are moving from python to typescript because ya)`);
  }

  // add client permission labels
  // add user permission labels
  // add ratelimits
  // sort commands by name
  async run(context: Command.Context, args: CommandArgs) {
    const { commands } = args;

    const pageLimit = commands.length || 1;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = createUserEmbed(context.user);
        const resultNumber = page - 1;
        if (resultNumber in commands) {
          const command = commands[resultNumber];
          const metadata = command.metadata as CommandMetadata;

          embed.setTitle(command.name);
          embed.setDescription(metadata.description);

          if (command.aliases.length) {
            embed.addField('Aliases', command.aliases.join('\n'), true);
          }
          if (metadata.examples && metadata.examples.length) {
            embed.addField('Examples', Markup.escape.mentions(metadata.examples.join('\n')), true);
          }
          {
            const description: Array<string> = [];

            description.push(`**NSFW**: ${(metadata.nsfw) ? 'Yes' : 'No'}`);
            description.push(`**Type**: ${toTitleCase(metadata.type)}`);

            embed.addField('Information', description.join('\n'));
          }
          embed.addField('Usage', (metadata.usage) ? metadata.usage : 'good luck, not finished');
        }
        embed.setFooter(`Command ${page} of ${pageLimit} Found`);
        return embed;
      },
    });
    return await paginator.start();
  }
}

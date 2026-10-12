import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories, EmbedBrands, EmbedColors, StatusEmojis } from '../../../constants';
import { I18n, Paginator, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';

import { BaseCommand, CommandMetadata } from '../basecommand';


export interface CommandArgsBefore {
  commands: Array<Command.Command> | null,
}

export interface CommandArgs {
  commands: Array<Command.Command>,
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
        category: CommandCategories.UTILS,
        usage: '',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: (content: string, context: Command.Context) => {
        if (content) {
          const commands: Array<Command.Command> = [];
          const commandsWithPrefix: Array<Command.Command> = [];

          const insensitive = content.toLowerCase().replace(/\s\s+/g, ' ');
          const insensitiveAsPrefix = insensitive + ' ';

          for (let command of context.commandClient.commands) {
            if (command.names.includes(insensitive)) {
              commandsWithPrefix.push(command);
              continue;
            }
            if (command.names.some((name) => name.startsWith(insensitiveAsPrefix))) {
              commandsWithPrefix.push(command);
              continue;
            }
            if (command.names.some((name) => name.startsWith(insensitive))) {
              commands.push(command);
              continue;
            }
          }
          return [
            ...commandsWithPrefix.sort((x, y) => {
              if (x.names.includes(insensitive)) {
                return -1;
              }
              return x.name.localeCompare(y.name);
            }),
            ...commands.sort((x, y) => x.name.localeCompare(y.name)),
          ];
        }
        return null;
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.commands && !!args.commands.length;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.commands) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`);
    }
    return editOrReply(context, translate('help.links', {commands: '<https://notsobot.com/commands>', invite: '<https://notsobot.com/support/invite>'}));
  }

  // add client permission labels
  // add user permission labels
  // add ratelimits
  // sort commands by name
  async run(context: Command.Context, args: CommandArgs) {
    const { commands } = args;
    const { translate } = await I18n.getTranslator(context);

    const pageLimit = commands.length || 1;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = createUserEmbed(context.user);
        const resultNumber = page - 1;
        if (resultNumber in commands) {
          const command = commands[resultNumber];

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

          const metadata = command.metadata as CommandMetadata;

          embed.setColor(EmbedColors.DEFAULT);
          embed.setTitle(name);
          embed.setDescription(metadata.description || '');

          if (names.length) {
            embed.addField(translate('help.aliases'), names.join('\n'), true);
          }
          if (metadata.examples && metadata.examples.length) {
            embed.addField(translate('help.examples'), Markup.escape.mentions(metadata.examples.join('\n')), true);
          }
          {
            const description: Array<string> = [];

            description.push(`**${translate('help.category')}**: ${toTitleCase(metadata.category)}`);
            description.push(`**NSFW**: ${translate((metadata.nsfw) ? 'common.yes' : 'common.no')}`);

            embed.addField(translate('common.information'), description.join('\n'));
          }
          {
            let text: string;
            if (typeof(metadata.usage) === 'string') {
              text = Markup.codeblock(`${context.prefix}${name} ${metadata.usage}`.trim());
            } else {
              text = translate('help.usage_unfinished');
            }
            embed.addField(translate('help.usage'), text);
          }
        }
        embed.setFooter(translate('help.footer', {page, total: pageLimit}), EmbedBrands.NOTSOBOT);
        return embed;
      },
    });
    return await paginator.start();
  }
}

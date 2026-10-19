import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories, CommandCategoryNames, EmbedBrands, EmbedColors, StatusEmojis } from '../../../constants';
import { DisplayPayload, I18n, Paginator, displayReply, toTitleCase } from '../../../utils';

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
        category: CommandCategories.UTILITY,
        usage: '?<command-name>',
      },
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
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`});
    }
    return displayReply(context, {description: translate('help.links', {commands: '<https://notsobot.com/commands>', invite: '<https://notsobot.com/support/invite>'})});
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
        const payload: DisplayPayload = {fields: []};
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

          payload.color = EmbedColors.DEFAULT;
          payload.title = name;
          payload.description = metadata.description || '';

          if (names.length) {
            payload.fields!.push({inline: true, name: translate('help.aliases'), value: names.join('\n')});
          }
          if (metadata.examples && metadata.examples.length) {
            payload.fields!.push({inline: true, name: translate('help.examples'), value: Markup.escape.mentions(metadata.examples.join('\n'))});
          }
          {
            const description: Array<string> = [];

            description.push(`**${translate('help.category')}**: ${CommandCategoryNames[metadata.category] || toTitleCase(metadata.category)}`);
            description.push(`**NSFW**: ${translate((metadata.nsfw) ? 'common.yes' : 'common.no')}`);
            if (metadata.credits && metadata.credits.length) {
              // mentions in embeds don't ping
              description.push(`**${translate('help.credits')}**: ${metadata.credits.map((credit) => `<@${credit.id}>`).join(', ')}`);
            }

            payload.fields!.push({name: translate('common.information'), value: description.join('\n')});
          }
          {
            let text: string;
            if (typeof(metadata.usage) === 'string') {
              text = Markup.codeblock(`${context.prefix}${name} ${metadata.usage}`.trim());
            } else {
              text = translate('help.usage_unfinished');
            }
            payload.fields!.push({name: translate('help.usage'), value: text});
          }
          {
            // only args with a description, so hidden flags stay out of help
            const lines: Array<string> = [];
            for (let arg of command.argParser.args) {
              const description = (arg.metadata && arg.metadata.description) || '';
              if (!description) {
                continue;
              }
              const prefix = Array.from(arg.prefixes).shift() || '';
              let line = `**${prefix}${arg.name}**`;
              if (arg.aliases.length) {
                line += ` (${arg.aliases.map((alias) => `${prefix}${alias}`).join(', ')})`;
              }
              lines.push(`${line}: ${description}`);
            }
            if (lines.length) {
              payload.fields!.push({name: translate('help.arguments'), value: lines.join('\n')});
            }
          }
        }
        payload.footer = translate('help.footer', {page, total: pageLimit});
        payload.footerIconUrl = EmbedBrands.NOTSOBOT;
        return {display: payload};
      },
    });
    return await paginator.start();
  }
}

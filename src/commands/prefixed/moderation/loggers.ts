import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildLoggerTypes, StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'loggers';

export default class LoggersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildLoggerTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildLoggerTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'List all loggers inside of the server',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} members`,
        ],
        category: CommandCategories.SERVER,
        id: Formatter.Commands.ServerLoggers.COMMAND_ID,
        usage: '?<GuildLoggerTypes>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: -2,
      type: (value: string) => (GuildLoggerTypes as any)[value.toUpperCase()],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerLoggers.CommandArgs) {
    const guildId = context.guildId as string;

    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (!settings) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_lol')}`});
    }
    return Formatter.Commands.ServerLoggers.createLoggersEmbed(context, settings.loggers, {only: args.only});
  }
}

import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildAdminBypassLists, GuildAdminBypassValues, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands allowlist admin-bypass';

export interface CommandArgs {
  channels?: Array<Structures.Channel> | null,
  parsed: {
    command?: Command.Command | null,
    value: GuildAdminBypassValues | null,
  },
  roles?: Array<Structures.Role> | null,
  users?: Array<Structures.Member | Structures.User> | null,
}

export default class CommandsAllowlistAdminBypassCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds allowlist admin-bypass'],
      args: [
        {
          aliases: ['channel'],
          name: 'channels',
          type: Parameters.channels({
            types: [
              ChannelTypes.GUILD_CATEGORY,
              ChannelTypes.GUILD_NEWS,
              ChannelTypes.GUILD_TEXT,
            ],
          }),
        },
        {
          aliases: ['role'],
          name: 'roles',
          type: Parameters.roles,
        },
        {
          aliases: ['user'],
          name: 'users',
          type: Parameters.membersOrUsers({allowBots: false}),
        },
      ],
      disableDm: true,
      label: 'parsed',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Set if the server owner and admins skip the command allowlist, or some of its entries. Without a command it changes the server setting.',
        examples: [
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} off imagine`,
          `${COMMAND_NAME} on imagine -channels lobby`,
          `${COMMAND_NAME} default imagine -roles members`,
        ],
        id: Formatter.Commands.ModerationAdminBypass.COMMANDS_ALLOWLIST_COMMAND_ID,
        usage: '<on|off|default> ?<command-name> (-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)',
      },
      permissions: [Permissions.ADMINISTRATOR],
      type: async (value: string, context: Command.Context) => {
        const { rest, value: bypass } = Formatter.Commands.ModerationAdminBypass.parseValueText(value);
        const command = (rest) ? await Parameters.prefixedCommand(rest, context) : undefined;
        return {command, value: bypass};
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    if (!args.parsed.value) {
      return false;
    }
    return Formatter.Commands.ModerationAdminBypass.isValidCommandArgs({...args, command: args.parsed.command});
  }

  async onCancelRun(context: Command.Context, args: CommandArgs) {
    let content: string;
    if (!args.parsed.value) {
      const { translate } = await I18n.getTranslator(context);
      content = translate('moderation.admin_bypass.needs_value');
    } else {
      content = await Formatter.Commands.ModerationAdminBypass.getInvalidCommandArgsText(context, {...args, command: args.parsed.command});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${content}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { command, value } = args.parsed;
    const targets = (command) ? Formatter.Commands.ModerationAdminBypass.getCommandTargets(context, {...args, command}) : null;
    return Formatter.Commands.ModerationAdminBypass.createMessage(context, GuildAdminBypassLists.COMMANDS_ALLOWLIST, {
      targets,
      value: value!,
    });
  }
}

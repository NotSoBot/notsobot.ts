import { Command, CommandClient, Structures } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'rules check';

export interface CommandArgsBefore {
  channel?: Structures.Channel | null,
  command: Command.Command | null,
  user?: Structures.Member | Structures.User | null,
}

export default class RulesCheckCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'channel', type: Parameters.channel({inGuild: true})},
        {name: 'user', type: Parameters.memberOrUser()},
      ],
      disableDm: true,
      label: 'command',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See which rule decides if someone can use a command in a channel',
        examples: [
          `${COMMAND_NAME} imagine`,
          `${COMMAND_NAME} imagine -user notsobot -channel general`,
        ],
        id: Formatter.Commands.ModerationRulesCheck.COMMAND_ID,
        usage: '<command-name> (-channel <channel:id|mention|name>) (-user <user:id|mention|name>)',
      },
      type: Parameters.prefixedCommand,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.command;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.ModerationRulesCheck.createMessage(context, {
      channel: args.channel || null,
      command: args.command!,
      user: args.user || null,
    });
  }
}

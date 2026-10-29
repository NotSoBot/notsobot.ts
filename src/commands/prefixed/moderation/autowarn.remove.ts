import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildWarningAutoTriggers, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'autowarn remove';

export interface CommandArgs {
  channel?: Structures.Channel | null,
  trigger: GuildWarningAutoTriggers | null,
}

export default class AutowarnRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autowarn delete'],
      args: [
        {name: 'channel', type: Parameters.channel({types: Formatter.Commands.ModerationAutowarn.CHANNEL_TYPES as any})},
      ],
      disableDm: true,
      label: 'trigger',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Remove an auto-warn rule, the server-wide one or a channel\'s',
        examples: [
          `${COMMAND_NAME} mentions`,
          `${COMMAND_NAME} blocked -channel general`,
        ],
        id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_REMOVE,
        usage: '<mentions|blocked> (-channel <channel:id|mention|name>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Formatter.Commands.ModerationAutowarn.triggerParser,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return !!args.trigger && args.channel !== null;
  }

  async onCancelRun(context: Command.Context, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_autowarn.unknown_trigger')}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      channel: args.channel || null,
      remove: true,
      trigger: args.trigger!,
    });
  }
}

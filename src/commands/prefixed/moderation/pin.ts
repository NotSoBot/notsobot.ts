import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'pin';

export default class PinCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'first', type: Boolean},
        {name: 'in', default: DefaultParameters.channel, type: Parameters.channel({
          types: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_NEWS],
        })},
      ],
      disableDm: true,
      label: 'query',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Pin a message by its ID or link, the first message on or after a date, or the latest message containing some text',
        examples: [
          `${COMMAND_NAME} 1240414316425789460`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1240414316425789460`,
          `${COMMAND_NAME} 2024-05-14`,
          `${COMMAND_NAME} welcome to the server`,
          `${COMMAND_NAME} rules -in general`,
          `${COMMAND_NAME} -first`,
        ],
        id: Formatter.Commands.ModerationPin.COMMAND_ID,
        usage: '<message_id|message_link|date|text> (-first) (-in <channel:id|mention|name>)',
      },
      permissionsClient: [Permissions.PIN_MESSAGES],
      permissions: [Permissions.PIN_MESSAGES],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationPin.CommandArgsBefore) {
    if (args.in === null) {
      return false;
    }
    return !!args.first || !!args.query;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationPin.CommandArgsBefore) {
    if (args.in === null) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.channel_not_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationPin.CommandArgs) {
    return Formatter.Commands.ModerationPin.createMessage(context, args);
  }
}

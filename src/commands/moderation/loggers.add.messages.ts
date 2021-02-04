import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';

import { createGuildLogger } from '../../api';
import { CommandTypes, GuildLoggerTypes } from '../../constants';

import { createLoggersEmbed } from './loggers';
import { LoggersAddBaseCommand, CommandArgs } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add messages';

export default class LoggersAddMessagesCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for message events.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel message-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        type: CommandTypes.MODERATION,
        usage:  '(-channel <text-channel:id|mention|name>) (-in <category-channel:idmention|name>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild as Structures.Guild;

    let channel: Structures.Channel;
    if (args.channel) {
      channel = args.channel;
    } else {
      channel = await guild.createChannel({
        name: 'message-logs',
        parentId: (args.in) ? args.in.id : undefined,
        type: ChannelTypes.GUILD_TEXT,
      });
    }

    const webhook = await channel.createWebhook({name: 'NotSoLogs'});
    const loggers = await createGuildLogger(context, guild.id, {
      channelId: channel.id,
      type: GuildLoggerTypes.MESSAGES,
      webhookId: webhook.id,
      webhookToken: webhook.token,
    });
    return createLoggersEmbed(context, loggers, {title: `Created a Message Logger in ${channel} (${channel.id})`});
  }
}

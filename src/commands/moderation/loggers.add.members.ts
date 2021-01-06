import { Command, Structures } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';

import { createGuildLogger } from '../../api';
import { CommandTypes, GuildLoggerTypes } from '../../constants';

import { createLoggersEmbed } from './loggers';
import { LoggersAddBaseCommand, CommandArgs } from './loggers.add.base';


export default class LoggersAddMembersCommand extends LoggersAddBaseCommand {
  name = 'loggers add members';

  metadata = {
    description: 'Create a logger for member events.',
    examples: [
      'loggers add members',
      'loggers add members -channel member-logs',
      'loggers add members -in logs',
    ],
    type: CommandTypes.MODERATION,
    usage: 'loggers add members (-channel <text-channel mention|name>) (-in <category-channel mention|name>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild as Structures.Guild;

    let channel: Structures.Channel;
    if (args.channel) {
      channel = args.channel;
    } else {
      channel = await guild.createChannel({
        name: 'member-logs',
        parentId: (args.in) ? args.in.id : undefined,
        type: ChannelTypes.GUILD_TEXT,
      });
    }

    const webhook = await channel.createWebhook({name: 'NotSoLogs'});
    const loggers = await createGuildLogger(context, guild.id, {
      channelId: channel.id,
      type: GuildLoggerTypes.MEMBERS,
      webhookId: webhook.id,
      webhookToken: webhook.token,
    });
    return createLoggersEmbed(context, loggers, {title: `Created a Member Logger in ${channel} (${channel.id})`});
  }
}

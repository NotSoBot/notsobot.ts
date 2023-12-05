import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';



export const COMMAND_NAME = 'wordcloud';

export default class WordcloudCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['wc'],
      args: [
        {name: 'before', type: Parameters.snowflake},
        {name: 'max', default: 500, type: Parameters.number({max: 1000, min: 0})},
      ],
      default: DefaultParameters.channel,
      label: 'channel',
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Generate a wordcloud from past messages',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> -max 500`,
        ],
        id: Formatter.Commands.MediaICreateWordcloudChannel.COMMAND_ID,
        usage: '...<channel:id|mention|name> (-max <number>)',
      },
      type: Parameters.channel({
        types: [
          ChannelTypes.GUILD_NEWS,
          ChannelTypes.GUILD_TEXT,
        ],
      }),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudChannel.CommandArgs) {
    return context.inDm || !!args.channel;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudChannel.CommandArgs) {
    return editOrReply(context, 'Unable to find that channel');
  }

  run(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudChannel.CommandArgs) {
    return Formatter.Commands.MediaICreateWordcloudChannel.createMessage(context, args);
  }
}

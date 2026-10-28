import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';

import { CommandCategories, MediaWordcloudShapes, MediaWordcloudThemes } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';



export const COMMAND_NAME = 'wordcloud';

export default class WordcloudCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['wc'],
      args: [
        {name: 'before', type: Parameters.snowflake},
        {name: 'bots', type: Boolean, metadata: {description: 'include messages from bots'}},
        {name: 'exclude', metadata: {description: 'words to leave out, split by commas'}},
        {name: 'image', type: Parameters.mediaUrl({audio: false, video: false, onlyContent: true}), metadata: {description: 'the words fill its shape and take its colors'}},
        {name: 'shape', type: Parameters.oneOf({choices: MediaWordcloudShapes})},
        {name: 'theme', type: Parameters.oneOf({choices: MediaWordcloudThemes})},
        {name: 'max', default: 500, type: Parameters.number({max: 1000, min: 0}), metadata: {description: '0 to 1000'}},
      ],
      default: DefaultParameters.channel,
      label: 'channel',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Generate a wordcloud from past messages',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> -max 500`,
          `${COMMAND_NAME} lobby -shape heart -theme sunset`,
          `${COMMAND_NAME} -image https://cdn.nsb.gg/assets/samples/face.png -exclude lol,lmao`,
        ],
        id: Formatter.Commands.MediaICreateWordcloudChannel.COMMAND_ID,
        usage: '...<channel:id|mention|name> (-before <message_id>) (-bots) (-exclude <words>) (-image <emoji,user:id|mention|name,url>) (-max <number>) (-shape <choice>) (-theme <choice>)',
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

  async onCancelRun(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudChannel.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('errors.channel_not_found')});
  }

  run(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudChannel.CommandArgs) {
    return Formatter.Commands.MediaICreateWordcloudChannel.createMessage(context, args);
  }
}

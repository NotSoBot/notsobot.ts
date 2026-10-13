import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag export';

export default class TagExportCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t export'],
      args: [
        {name: 'content', type: Parameters.string({maxLength: 1000})},
        {name: 'name', type: Parameters.string({maxLength: 64})},
        {name: 'user', type: Parameters.memberOrUser({allowBots: false})},
      ],
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Export tags from a server with filters',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -content discord.gg`,
          `${COMMAND_NAME} -name badword`,
          `${COMMAND_NAME} -user cake#1`,
        ],
        id: Formatter.Commands.TagExport.COMMAND_ID,
        usage: '(-content <string>) (-name <string>) (-user <user:id|mention|name>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagExport.CommandArgs) {
    return args.user !== null;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagExport.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.user === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagExport.CommandArgs) {
    return Formatter.Commands.TagExport.createMessage(context, args);
  }
}

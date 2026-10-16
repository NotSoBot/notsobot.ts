import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag get';

export default class TagGetCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t get'],
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Get a tag from the Tag Directory or your DMs',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 1290000000000000000`,
          `${COMMAND_NAME} https://notsobot.com/tags/directory/1290000000000000000 coolname`,
          `${COMMAND_NAME} "my dm tag" newname`,
        ],
        id: Formatter.Commands.TagGet.COMMAND_ID,
        // without a tag, the newest tag directory link posted in the channel
        usage: '?<tag directory id/link or dm tag> ?<name>',
      },
      type: [
        {name: 'tag', type: Parameters.tagToGet, default: DefaultParameters.lastTagDirectoryId},
        {name: 'name', type: Parameters.tagName, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagGet.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagGet.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.unknown')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagGet.CommandArgs) {
    return Formatter.Commands.TagGet.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag add';

export default class TagAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t add'],
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Add a tag from the Tag Directory or your DMs',
        examples: [
          `${COMMAND_NAME} 1290000000000000000`,
          `${COMMAND_NAME} https://notsobot.com/directory/tags/1290000000000000000 coolname`,
          `${COMMAND_NAME} "my dm tag" newname`,
        ],
        id: Formatter.Commands.TagAdd.COMMAND_ID,
        usage: '<tag directory id/link or dm tag> ?<name>',
      },
      type: [
        {name: 'tag', type: Parameters.tagToAdd},
        {name: 'name', type: Parameters.tagName, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagAdd.CommandArgs) {
    return Formatter.Commands.TagAdd.createMessage(context, args);
  }
}

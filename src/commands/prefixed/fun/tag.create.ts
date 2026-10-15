import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag create';

export default class TagCreateCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t create', 'tag add', 't add'],
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Create a tag',
        examples: [
          `${COMMAND_NAME} test im a tag`,
          `${COMMAND_NAME} "test tag" im a test tag!`,
        ],
        id: Formatter.Commands.TagCreate.COMMAND_ID,
        usage: '<tagname> <...body>',
      },
      type: [
        {name: 'tag', type: Parameters.tagName},
        {name: 'content', default: '', type: Parameters.tagContent, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagCreate.CommandArgs) {
    return !!args.tag && !!args.content;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagCreate.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag || args.content) {
      if (!args.tag) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.needs_name')}`});
      }
      if (!args.content) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.needs_content')}`});
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCreate.CommandArgs) {
    return Formatter.Commands.TagCreate.createMessage(context, args);
  }
}

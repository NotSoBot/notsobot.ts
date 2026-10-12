import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag edit';

export default class TagEditCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t edit'],
      metadata: {
        category: CommandCategories.FUN,
        description: 'Edit a tag',
        examples: [
          `${COMMAND_NAME} test im a tag`,
          `${COMMAND_NAME} "test tag" im a test tag!`,
        ],
        id: Formatter.Commands.TagEdit.COMMAND_ID,
        usage: '<tagname> <...body>',
      },
      type: [
        {name: 'tag', default: null, type: Parameters.NotSoTag},
        {name: 'content', type: Parameters.tagContent, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagEdit.CommandArgsBefore) {
    if (args.tag && args.tag.user.id !== context.userId) {
      return false;
    }
    return !!args.tag && !!args.content;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagEdit.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null || args.content) {
      if (args.tag === false) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
      }
      if (!args.content) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.needs_content')}`);
      }
      if (args.tag && args.tag.user.id !== context.userId) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.not_owner')}`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagEdit.CommandArgs) {
    return Formatter.Commands.TagEdit.createMessage(context, args);
  }
}

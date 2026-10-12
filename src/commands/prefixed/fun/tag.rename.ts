import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag rename';

export default class TagRenameCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t rename'],
      metadata: {
        category: CommandCategories.FUN,
        description: 'Rename a tag',
        examples: [
          `${COMMAND_NAME} test test1`,
          `${COMMAND_NAME} "test tag" test tag1`,
          `${COMMAND_NAME} "test tag" "test tag1"`,
        ],
        id: Formatter.Commands.TagRename.COMMAND_ID,
        usage: '<tagname> <tagname2>',
      },
      type: [
        {name: 'tag', default: null, type: Parameters.NotSoTag},
        {name: 'name', type: Parameters.tagName, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagRename.CommandArgsBefore) {
    if (args.tag && args.tag.user.id !== context.userId) {
      return false;
    }
    return !!args.tag && !!args.name;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagRename.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null || args.name) {
      if (args.tag === false) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
      }
      if (!args.name) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.rename_needs_name')}`);
      }
      if (args.tag && args.tag.user.id !== context.userId) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.not_owner')}`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRename.CommandArgs) {
    return Formatter.Commands.TagRename.createMessage(context, args);
  }
}

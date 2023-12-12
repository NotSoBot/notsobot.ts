import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

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

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagRename.CommandArgsBefore) {
    if (args.tag !== null || args.name) {
      if (args.tag === false) {
        return editOrReply(context, '⚠ Unknown Tag');
      }
      if (!args.name) {
        return editOrReply(context, '⚠ Gotta have some sort of tag name to rename to');
      }
      if (args.tag && args.tag.user.id !== context.userId) {
        return editOrReply(context, '⚠ You don\'t own that tag!');
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRename.CommandArgs) {
    return Formatter.Commands.TagRename.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag alias';

export default class TagAliasCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t alias'],
      metadata: {
        category: CommandCategories.FUN,
        description: 'Create a tag alias',
        examples: [
          `${COMMAND_NAME} test1 test`,
          `${COMMAND_NAME} "test tag1" test tag`,
          `${COMMAND_NAME} "test tag1" "test tag"`,
        ],
        id: Formatter.Commands.TagAlias.COMMAND_ID,
        usage: '<tagname> <tagname2>',
      },
      type: [
        {name: 'name', type: Parameters.tagName},
        {name: 'tag', default: null, type: Parameters.NotSoTag, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagAlias.CommandArgsBefore) {
    return !!args.tag && !!args.name;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagAlias.CommandArgsBefore) {
    if (args.tag !== null || args.name) {
      if (!args.name) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Gotta have some sort of tag name to create an alias for`);
      }
      if (args.tag === false) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagAlias.CommandArgs) {
    return Formatter.Commands.TagAlias.createMessage(context, args);
  }
}

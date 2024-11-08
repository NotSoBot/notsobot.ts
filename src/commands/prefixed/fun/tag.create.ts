import { Command, CommandClient } from 'detritus-client';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag create';

export default class TagCreateCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t create', 'tag add', 't add'],
      metadata: {
        category: CommandCategories.FUN,
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
        {name: 'content', type: Parameters.tagContent, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagCreate.CommandArgs) {
    return !!args.tag && !!args.content;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagCreate.CommandArgs) {
    if (args.tag || args.content) {
      if (!args.tag) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Gotta have some sort of tag name`);
      }
      if (!args.content) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Must have some sort of content for the tag!`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCreate.CommandArgs) {
    return Formatter.Commands.TagCreate.createMessage(context, args);
  }
}

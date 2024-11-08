import { Command, CommandClient } from 'detritus-client';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag remove tag';

export default class TagRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tag remove', 't remove', 't remove tag'],
      args: [
        {name: 'force', type: Boolean},
      ],
      label: 'tag',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Delete a tag',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
          `${COMMAND_NAME} some tag -force`,
        ],
        id: Formatter.Commands.TagRemove.COMMAND_ID,
        usage: '<tagname> (-force)',
      },
      type: Parameters.NotSoTag,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagRemove.CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagRemove.CommandArgsBefore) {
    if (args.tag === false) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRemove.CommandArgs) {
    return Formatter.Commands.TagRemove.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { BooleanEmojis, CommandCategories, UserFlags } from '../../../constants';
import UserStore from '../../../stores/users';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag commands remove';

export default class TagCommandsRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t commands remove'],
      label: 'tag',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Remove a tag from the custom command list',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
        ],
        id: Formatter.Commands.TagCommandsRemove.COMMAND_ID,
        usage: '<tagname>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: 1,
      type: Parameters.NotSoTag,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagCommandsRemove.CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagCommandsRemove.CommandArgsBefore) {
    if (args.tag === false) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCommandsRemove.CommandArgs) {
    return Formatter.Commands.TagCommandsRemove.createMessage(context, args);
  }
}

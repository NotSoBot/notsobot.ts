import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag commands add';

export default class TagCommandsAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t commands add'],
      label: 'tag',
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Add a tag into the custom command list',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
        ],
        id: Formatter.Commands.TagCommandsAdd.COMMAND_ID,
        usage: '<tagname>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: 1,
      type: Parameters.NotSoTag,
    });
  }

  async onBefore(context: Command.Context) {
    const reason = await Formatter.Commands.TagCommandsAdd.getCannotAddReason(context);
    if (reason) {
      context.metadata = context.metadata || {};
      context.metadata.content = reason;
      return false;
    }
    return true;
  }

  onCancel(context: Command.Context) {
    if (context.metadata && context.metadata.content) {
      return displayReply(context, {description: context.metadata.content});
    }
    return super.onCancel(context);
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagCommandsAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagCommandsAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCommandsAdd.CommandArgs) {
    return Formatter.Commands.TagCommandsAdd.createMessage(context, args);
  }
}

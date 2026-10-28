import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis, UserFlags } from '../../../constants';
import UserStore from '../../../stores/users';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag commands remove';

export default class TagCommandsRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t commands remove'],
      label: 'tag',
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Stop a tag being a custom command in this server',
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

  async onCancelRun(context: Command.Context, args: Formatter.Commands.TagCommandsRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCommandsRemove.CommandArgs) {
    return Formatter.Commands.TagCommandsRemove.createMessage(context, args);
  }
}

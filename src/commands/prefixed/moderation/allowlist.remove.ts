import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'allowlist remove';

export default class AllowlistRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'allowlist delete',
      ],
      disableDm: true,
      label: 'payloads',
      metadata: {
        description: 'Remove allowlist items based on the mention type.',
        examples: [
          `${COMMAND_NAME} <#585639594574217232>`,
          `${COMMAND_NAME} <@300505364032389122> <@&178314191524855808>`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationAllowlistRemove.COMMAND_ID,
        usage: '...<channel:mention,role:mention,user:mention>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: Formatter.Commands.ModerationAllowlistAdd.getItemsFromMention,
    });
  }

  // maybe add owner check?
  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgsBefore) {
    const { payloads } = args;
    return !!payloads && !!payloads.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgsBefore) {
    if (args.payloads) {
      return context.editOrReply(`${StatusEmojis.WARNING} Unable to find any valid Text Channels, Roles, or Users`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} Provide some kind of mention`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistRemove.createMessage(context, args);
  }
}

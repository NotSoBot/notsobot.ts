import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ModerationAllowlistRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove channels, roles, or users from the allowlist';
  metadata = {
    id: Formatter.Commands.ModerationAllowlistRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'items',
          description: 'Channels, roles, or users to remove (Mentions, separated by spaces)',
          label: 'payloads',
          required: true,
          value: Formatter.Commands.ModerationAllowlistAdd.getItemsFromMention,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgsBefore) {
    return !!args.payloads && !!args.payloads.length;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgsBefore) {
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} Unable to find any valid Text Channels, Roles, or Users`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistRemove.createMessage(context, args);
  }
}

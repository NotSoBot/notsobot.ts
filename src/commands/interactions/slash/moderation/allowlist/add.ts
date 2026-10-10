import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class ModerationAllowlistAddCommand extends BaseInteractionCommandOption {
  description = 'Add channels, roles, or users to the allowlist';
  metadata = {
    id: Formatter.Commands.ModerationAllowlistAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'items',
          description: 'Channels, roles, or users to add (Mentions, separated by spaces)',
          label: 'payloads',
          required: true,
          value: Formatter.Commands.ModerationAllowlistAdd.getItemsFromMention,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistAdd.CommandArgsBefore) {
    return !!args.payloads && !!args.payloads.length;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistAdd.CommandArgsBefore) {
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} Unable to find any valid Text Channels, Roles, or Users`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistAdd.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistAdd.createMessage(context, args);
  }
}

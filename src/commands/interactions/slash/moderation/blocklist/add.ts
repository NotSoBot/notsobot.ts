import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { GuildBlocklistTypes, StatusEmojis } from '../../../../../constants';
import { Formatter, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class ModerationBlocklistAddCommand extends BaseInteractionCommandOption {
  description = 'Add channels, roles, or users to the blocklist';
  metadata = {
    id: Formatter.Commands.ModerationBlocklistAdd.COMMAND_ID,
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
          value: Formatter.Commands.ModerationBlocklistAdd.getItemsFromMention,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgsBefore) {
    return !!args.payloads && !!args.payloads.length && !args.payloads.some((payload) => {
      return payload.type === GuildBlocklistTypes.USER && payload.item.id === context.userId;
    });
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgsBefore) {
    if (args.payloads && args.payloads.length) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} Don\'t block yourself dummy`,
        flags: MessageFlags.EPHEMERAL,
      });
    }
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} Unable to find any valid Text Channels, Roles, or Users`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistAdd.createMessage(context, args);
  }
}

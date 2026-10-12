import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class ModerationAllowlistAddCommand extends BaseInteractionCommandOption {
  description = 'Add channels, roles, or users to the allowlist';
  descriptionLocalizations = I18n.localizations('commands.moderation.allowlist.add.description');
  metadata = {
    id: Formatter.Commands.ModerationAllowlistAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.allowlist.add.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'items',
          description: 'Channels, roles, or users to add (Mentions, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.allowlist.add.items'),
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

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistAdd.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistAdd.createMessage(context, args);
  }
}

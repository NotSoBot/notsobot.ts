import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ServerAllowlistRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove channels, roles, or users from the allowlist';
  descriptionLocalizations = I18n.localizations('commands.moderation.allowlist.remove.description');
  metadata = {
    id: Formatter.Commands.ModerationAllowlistRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.allowlist.remove.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      options: [
        {
          name: 'items',
          description: 'Channels, roles, or users to remove (Mentions, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.allowlist.remove.items'),
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

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlistRemove.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistRemove.createMessage(context, args);
  }
}

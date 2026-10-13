import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ModerationBlocklistRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove channels, roles, or users from the blocklist';
  descriptionLocalizations = I18n.localizations('commands.moderation.blocklist.remove.description');
  metadata = {
    id: Formatter.Commands.ModerationBlocklistRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.blocklist.remove.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      options: [
        {
          name: 'items',
          description: 'Channels, roles, or users to remove (Mentions, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.blocklist.remove.items'),
          label: 'payloads',
          required: true,
          value: Formatter.Commands.ModerationBlocklistAdd.getItemsFromMention,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistRemove.CommandArgsBefore) {
    return !!args.payloads && !!args.payloads.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistRemove.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistRemove.createMessage(context, args);
  }
}

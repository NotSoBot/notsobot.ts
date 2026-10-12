import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { GuildBlocklistTypes, StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class ModerationBlocklistAddCommand extends BaseInteractionCommandOption {
  description = 'Add channels, roles, or users to the blocklist';
  descriptionLocalizations = I18n.localizations('commands.moderation.blocklist.add.description');
  metadata = {
    id: Formatter.Commands.ModerationBlocklistAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.blocklist.add.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'items',
          description: 'Channels, roles, or users to add (Mentions, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.blocklist.add.items'),
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

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payloads && args.payloads.length) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('commands.context.blocklist_add.self')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    }
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistAdd.createMessage(context, args);
  }
}

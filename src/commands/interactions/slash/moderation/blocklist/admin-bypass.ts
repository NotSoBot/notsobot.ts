import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildAdminBypassLists, GuildAdminBypassValues, StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'admin-bypass';

export interface CommandArgs {
  payloads?: Array<Formatter.Commands.ModerationBlocklistAdd.BlocklistPayload> | null,
  value: GuildAdminBypassValues,
}

export class ModerationBlocklistAdminBypassCommand extends BaseInteractionCommandOption {
  description = 'Set if the server owner and admins skip the blocklist, or some of its entries';
  descriptionLocalizations = I18n.localizations('commands.moderation.blocklist.admin_bypass.description');
  metadata = {
    id: Formatter.Commands.ModerationAdminBypass.BLOCKLIST_COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.blocklist.admin_bypass.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      options: [
        {
          name: 'value',
          description: 'On, Off, or Default (on for the server setting, the server setting for entries)',
          ...I18n.optionLocalizations('commands.moderation.blocklist.admin_bypass.value'),
          choices: Parameters.Slash.oneOf(Formatter.Commands.ModerationAdminBypass.VALUE_CHOICES),
          required: true,
        },
        {
          name: 'items',
          description: 'Entries to change (Mentions, separated by spaces), leave empty for the server setting',
          ...I18n.optionLocalizations('commands.moderation.blocklist.admin_bypass.items'),
          label: 'payloads',
          value: Formatter.Commands.ModerationBlocklistAdd.getItemsFromMention,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return args.payloads === undefined || (!!args.payloads && !!args.payloads.length);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const targets = (args.payloads) ? args.payloads.map((payload) => ({id: payload.item.id, type: payload.type})) : null;
    return Formatter.Commands.ModerationAdminBypass.createMessage(context, GuildAdminBypassLists.BLOCKLIST, {
      targets,
      value: args.value,
    });
  }
}

import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildAdminBypassLists, GuildAdminBypassValues, StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'admin-bypass';

export interface CommandArgs {
  payloads?: Array<Formatter.Commands.ModerationAllowlistAdd.AllowlistPayload> | null,
  value: GuildAdminBypassValues,
}

export class ServerAllowlistAdminBypassCommand extends BaseInteractionCommandOption {
  description = 'Set if the server owner and admins skip the allowlist, or some of its entries';
  descriptionLocalizations = I18n.localizations('commands.moderation.allowlist.admin_bypass.description');
  metadata = {
    id: Formatter.Commands.ModerationAdminBypass.ALLOWLIST_COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.allowlist.admin_bypass.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      options: [
        {
          name: 'value',
          description: 'On, Off, or Default (on for the server setting, the server setting for entries)',
          ...I18n.optionLocalizations('commands.moderation.allowlist.admin_bypass.value'),
          choices: Parameters.Slash.oneOf(Formatter.Commands.ModerationAdminBypass.VALUE_CHOICES),
          required: true,
        },
        {
          name: 'items',
          description: 'Entries to change (Mentions, separated by spaces), leave empty for the server setting',
          ...I18n.optionLocalizations('commands.moderation.allowlist.admin_bypass.items'),
          label: 'payloads',
          value: Formatter.Commands.ModerationAllowlistAdd.getItemsFromMention,
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
    return Formatter.Commands.ModerationAdminBypass.createMessage(context, GuildAdminBypassLists.ALLOWLIST, {
      targets,
      value: args.value,
    });
  }
}

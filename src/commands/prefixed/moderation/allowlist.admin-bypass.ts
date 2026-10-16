import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildAdminBypassLists, GuildAdminBypassValues, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'allowlist admin-bypass';

export interface CommandArgs {
  parsed: {
    payloads: Array<Formatter.Commands.ModerationAllowlistAdd.AllowlistPayload> | null,
    value: GuildAdminBypassValues | null,
  },
}

export default class AllowlistAdminBypassCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'parsed',
      metadata: {
        description: 'Set if the server owner and admins skip the allowlist, or some of its entries. Without entries it changes the server setting.',
        examples: [
          `${COMMAND_NAME} off`,
          `${COMMAND_NAME} on <#585639594574217232>`,
          `${COMMAND_NAME} default <@&178314191524855808>`,
        ],
        category: CommandCategories.SERVER,
        id: Formatter.Commands.ModerationAdminBypass.ALLOWLIST_COMMAND_ID,
        usage: '<on|off|default> ...?<channel:mention,role:mention,user:mention>',
      },
      permissions: [Permissions.ADMINISTRATOR],
      type: async (value: string, context: Command.Context) => {
        const { rest, value: bypass } = Formatter.Commands.ModerationAdminBypass.parseValueText(value);
        const payloads = (rest) ? await Formatter.Commands.ModerationAllowlistAdd.getItemsFromMention(rest, context) : null;
        return {payloads, value: bypass};
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    const { payloads, value } = args.parsed;
    return !!value && (!payloads || !!payloads.length);
  }

  async onCancelRun(context: Command.Context, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.parsed.value) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.admin_bypass.needs_value')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { payloads, value } = args.parsed;
    const targets = (payloads) ? payloads.map((payload) => ({id: payload.item.id, type: payload.type})) : null;
    return Formatter.Commands.ModerationAdminBypass.createMessage(context, GuildAdminBypassLists.ALLOWLIST, {
      targets,
      value: value!,
    });
  }
}

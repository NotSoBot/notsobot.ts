import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist remove';

export default class BlocklistRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'blocklist delete',
      ],
      disableDm: true,
      label: 'payloads',
      metadata: {
        description: 'Remove blocklist items based on the mention type.',
        examples: [
          `${COMMAND_NAME} <#585639594574217232>`,
          `${COMMAND_NAME} <@300505364032389122> <@&178314191524855808>`,
        ],
        category: CommandCategories.SERVER,
        id: Formatter.Commands.ModerationBlocklistRemove.COMMAND_ID,
        usage: '...<channel:mention,role:mention,user:mention>',
      },
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: Formatter.Commands.ModerationBlocklistAdd.getItemsFromMention,
    });
  }

  // maybe add owner check?
  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemove.CommandArgsBefore) {
    const { payloads } = args;
    return !!payloads && !!payloads.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payloads) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.needs_mention')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemove.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistRemove.createMessage(context, args);
  }
}

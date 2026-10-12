import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildBlocklistTypes, StatusEmojis } from '../../../constants';
import { Formatter, I18n } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist add';

export default class BlocklistAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'payloads',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Add an item based on mention type to the blocklist.',
        examples: [
          `${COMMAND_NAME} <#585639594574217232>`,
          `${COMMAND_NAME} <@300505364032389122> <@&178314191524855808>`,
        ],
        id: Formatter.Commands.ModerationBlocklistAdd.COMMAND_ID,
        usage: '...<channel:mention,role:mention,user:mention>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: Formatter.Commands.ModerationBlocklistAdd.getItemsFromMention,
    });
  }

  // maybe add owner check?
  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgsBefore) {
    const { payloads } = args;
    return !!payloads && !!payloads.length && !payloads.some((payload) => {
      return payload.type === GuildBlocklistTypes.USER && payload.item.id === context.userId;
    });
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payloads) {
      if (args.payloads.length) {
        return context.editOrReply(`${StatusEmojis.WARNING} ${translate('commands.context.blocklist_add.self')}`);
      }
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.no_valid_items')}`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.needs_mention')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAdd.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistAdd.createMessage(context, args);
  }
}

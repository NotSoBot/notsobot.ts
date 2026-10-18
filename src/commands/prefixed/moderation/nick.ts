import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  payload: Formatter.Commands.ModerationNick.CommandArgsBefore | null,
}

export interface CommandArgs {
  payload: Formatter.Commands.ModerationNick.CommandArgs,
}

export const COMMAND_NAME = 'nick';

export default class NickCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['nickname'],
      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Change or reset a member\'s nickname',
        examples: [
          `${COMMAND_NAME} <@300505364032389122> troy`,
          `${COMMAND_NAME} 300505364032389122 some nickname`,
          `${COMMAND_NAME} "cake dan" troy`,
          `${COMMAND_NAME} <@300505364032389122>`,
        ],
        id: Formatter.Commands.ModerationNick.COMMAND_ID,
        usage: '<user:id|mention|name> ?<nickname>',
      },
      permissionsClient: [Permissions.MANAGE_NICKNAMES],
      permissions: [Permissions.MANAGE_NICKNAMES],
      // `nick mass` and its subcommands need to be checked first
      priority: -2,
      type: Formatter.Commands.ModerationNick.parsePayload,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload && args.payload.member instanceof Structures.Member;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.payload) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationNick.createMessage(context, args.payload);
  }
}

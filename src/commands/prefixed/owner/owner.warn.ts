import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner warn';

interface CommandArgs {
  payload: Parameters.BanPayloadMembersOnly | null,
}

export default class OwnerWarnCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'payload',
      metadata: {
        description: 'Warn users as NotSoBot staff, they see it in DMs and on their next command',
        examples: [
          `${COMMAND_NAME} 300505364032389122 stop spamming the image commands`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerWarn.COMMAND_ID,
        usage: '...<user:id|mention|name> <reason:string>',
      },
      type: Parameters.banPayload({allowBots: false}),
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return !!args.payload && !!args.payload.membersOrUsers.length && !!args.payload.text;
  }

  async onCancelRun(context: Command.Context, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload && args.payload.membersOrUsers.length) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('owner_warn.needs_reason')}`});
    }
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.needs_members')}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.OwnerWarn.createMessage(context, {reason: args.payload!.text, users: args.payload!.membersOrUsers});
  }
}

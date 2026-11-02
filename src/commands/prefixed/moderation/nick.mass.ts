import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'nick mass';

export default class NickMassCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'nobots', type: Boolean},
        {name: 'nousers', type: Boolean},
        {name: 'role', type: Parameters.role},
      ],
      disableDm: true,
      label: 'text',
      metadata: {
        description: 'Change the nickname of multiple members',
        examples: [
          `${COMMAND_NAME} troy`,
          `${COMMAND_NAME} troy -role admin`,
          `${COMMAND_NAME} troy -nobots`,
          `${COMMAND_NAME} {choose:🎄|🎅|🦌} {nick}`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationNickMass.COMMAND_ID,
        usage: '<text> (-nobots) (-nousers) (-role <role:id|mention|name>)',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner || ((context.guild) ? context.guild.memberCount <= Formatter.Commands.ModerationNickMass.MAX_MEMBERS : false);
  }

  async onCancel(context: Command.Context): Promise<any> {
    const { language, translate } = await I18n.getTranslator(context);
    if (context.guild && Formatter.Commands.ModerationNickMass.MAX_MEMBERS < context.guild.memberCount) {
      return displayReply(context, {description: translate('nickmass.too_many_members', {max: Formatter.Commands.ModerationNickMass.MAX_MEMBERS.toLocaleString(language)})});
    }
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationNickMass.CommandArgsBefore) {
    if (args.role === null) {
      return false;
    }
    if (args.nobots && args.nousers) {
      return false;
    }
    return !!args.text;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationNickMass.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.role === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('logger.unknown_role')}`});
    }
    if (args.nobots && args.nousers) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('nickmass.who_then_bots')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationNickMass.CommandArgs) {
    return Formatter.Commands.ModerationNickMass.createMessage(context, args);
  }
}


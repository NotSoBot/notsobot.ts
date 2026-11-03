import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'prune';

export default class PruneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'purge',
      ],
      args: [
        {name: 'after', type: Parameters.snowflake},
        {name: 'attachments', aliases: ['files'], type: Boolean},
        {name: 'before', type: Parameters.snowflake},
        {name: 'bots', type: Boolean},
        {name: 'embeds', type: Boolean},
        {name: 'from', aliases: ['user'], type: Parameters.membersOrUsers()},
        {name: 'images', type: Boolean},
        {name: 'in', default: DefaultParameters.channel, type: Parameters.channel({
          types: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_NEWS],
        })},
        {name: 'until', type: Parameters.snowflake},
        {name: 'with', type: Parameters.string({minLength: 1})},
        {name: 'yes', aliases: ['y'], type: Boolean},
      ],
      default: null,
      label: 'amount',
      metadata: {
        description: 'Delete recent messages in bulk (10 by default)',
        examples: [
          `${COMMAND_NAME} 100`,
          `${COMMAND_NAME} 500 -with discord.gg -in general`,
          `${COMMAND_NAME} 100 -bots`,
          `${COMMAND_NAME} 100 -images -from cake`,
          `${COMMAND_NAME} 50 -yes`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationPrune.COMMAND_ID,
        usage: '<max_messages> (-after <message_id>) (-attachments) (-before <message_id>) (-bots) (-embeds) (-from ...<user:id|mention|name>) (-images) (-in <channel:id|mention|name>) (-until <message_id>) (-with <text>) (-yes)',
      },
      permissionsClient: [Permissions.MANAGE_MESSAGES],
      permissions: [Permissions.MANAGE_MESSAGES],
      type: Parameters.number({max: 500, min: 1}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationPrune.CommandArgsBefore) {
    // `-in` was given but didn't resolve, don't fall back to pruning the current channel
    if (args.in === null) {
      return false;
    }
    // `-from` with no value (or nobody found) used to come through as null, which turned the author filter off and
    // pruned everyone's messages
    if (args.from === null || (args.from && !args.from.length)) {
      return false;
    }
    // if afterId is after beforeId, error out
    if (args.after && args.before && BigInt(args.before) <= BigInt(args.after)) {
      return false;
    }
    // until must be before the current message
    if (args.until && BigInt(context.message.id) <= BigInt(args.until)) {
      return false;
    }
    if (args.amount === null) {
      if (args.until) {
        args.amount = 100;
      } else {
        return false;
      }
    }
    if (isNaN(args.amount)) {
      return false;
    }
    return true;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationPrune.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.in === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.channel_not_found')}`});
    }
    if (args.from === null || (args.from && !args.from.length)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
    }
    if (args.after && args.before && BigInt(args.before) <= BigInt(args.after)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('prune.after_before')}`});
    }
    if (args.until && BigInt(context.message.id) <= BigInt(args.until)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('prune.until_after_current')}`});
    }
    if (isNaN(args.amount)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('prune.amount_number')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationPrune.CommandArgsBefore) {
    const { yes, ...pruneArgs } = args;
    return Formatter.Commands.ModerationPrune.createMessage(context, pruneArgs, {skipConfirmation: yes});
  }
}

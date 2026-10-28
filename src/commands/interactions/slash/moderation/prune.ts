import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { I18n, Parameters, displayReply } from '../../../../utils';

import { createPruneMessage, snowflakeFromNow } from '../../../prefixed/moderation/prune';
import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  after?: string,
  amount?: number,
  attachments?: boolean,
  before?: string,
  bots?: boolean,
  embeds?: boolean,
  from?: Array<Structures.Member | Structures.User>,
  images?: boolean,
  in?: Structures.Channel,
  until?: string,
  with?: string,
}

export const COMMAND_NAME = 'prune';

export class ModerationPruneCommand extends BaseInteractionCommandOption {
  description = 'Delete recent messages in bulk';
  descriptionLocalizations = I18n.localizations('commands.moderation.prune.description');
  metadata = {
    id: 'moderation.prune',
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.prune.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_MESSAGES],
      permissionsClient: [Permissions.MANAGE_MESSAGES],
      options: [
        {name: 'amount', description: 'Amount of messages to delete (1..500) (Default: 100 with until)', ...I18n.optionLocalizations('commands.moderation.prune.amount'), maxValue: 500, minValue: 1, type: Number},
        {name: 'from', description: 'Only delete messages from these users (Mentions or IDs, separated by spaces)', ...I18n.optionLocalizations('commands.moderation.prune.from'), value: Parameters.membersOrUsers()},
        {name: 'with', description: 'Only delete messages containing this text', ...I18n.optionLocalizations('commands.moderation.prune.with')},
        {name: 'in', description: 'Channel to prune in (Default: Current Channel)', ...I18n.optionLocalizations('commands.moderation.prune.in'), channelTypes: [ChannelTypes.GUILD_NEWS, ChannelTypes.GUILD_TEXT], type: ApplicationCommandOptionTypes.CHANNEL},
        {name: 'after', description: 'Only delete messages after this message ID', ...I18n.optionLocalizations('commands.moderation.prune.after'), value: Parameters.snowflake},
        {name: 'before', description: 'Only delete messages before this message ID', ...I18n.optionLocalizations('commands.moderation.prune.before'), value: Parameters.snowflake},
        {name: 'until', description: 'Delete messages until this message ID', ...I18n.optionLocalizations('commands.moderation.prune.until'), value: Parameters.snowflake},
        {name: 'bots', description: 'Only delete messages from bots and webhooks', ...I18n.optionLocalizations('commands.moderation.prune.bots'), type: Boolean},
        {name: 'attachments', description: 'Only delete messages with attachments', ...I18n.optionLocalizations('commands.moderation.prune.attachments'), type: Boolean},
        {name: 'embeds', description: 'Only delete messages with embeds', ...I18n.optionLocalizations('commands.moderation.prune.embeds'), type: Boolean},
        {name: 'images', description: 'Only delete messages with images or videos (attachments or embeds)', ...I18n.optionLocalizations('commands.moderation.prune.images'), type: Boolean},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    if (args.after && args.before && BigInt(args.before) <= BigInt(args.after)) {
      return false;
    }
    if (args.until && BigInt(snowflakeFromNow()) <= BigInt(args.until)) {
      return false;
    }
    if (!args.amount) {
      if (args.until) {
        args.amount = 100;
      } else {
        return false;
      }
    }
    return true;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    let content: string;
    if (args.after && args.before && BigInt(args.before) <= BigInt(args.after)) {
      content = translate('prune.after_before');
    } else if (args.until && BigInt(snowflakeFromNow()) <= BigInt(args.until)) {
      content = translate('prune.until_after_current');
    } else {
      content = translate('prune.amount_number');
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${content}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createPruneMessage(context, {...args, amount: args.amount!});
  }
}

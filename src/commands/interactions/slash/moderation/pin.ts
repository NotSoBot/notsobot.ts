import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { I18n, displayReply } from '../../../../utils';

import { COMMAND_ID, createPinMessage } from '../../../prefixed/moderation/pin';
import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  channel?: Structures.Channel,
  first?: boolean,
  message?: string,
}

export const COMMAND_NAME = 'pin';

export class ModerationPinCommand extends BaseInteractionCommandOption {
  description = 'Pin a message by ID, link, date, or text';
  descriptionLocalizations = I18n.localizations('commands.moderation.pin.description');
  metadata = {
    id: COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.pin.name');

  constructor() {
    super({
      permissions: [Permissions.PIN_MESSAGES],
      permissionsClient: [Permissions.PIN_MESSAGES],
      options: [
        {name: 'message', description: 'Message ID, message link, date (YYYY-MM-DD), or text to search for', ...I18n.optionLocalizations('commands.moderation.pin.message'), maxLength: 1024},
        {name: 'first', description: 'Pin the first message in the channel', ...I18n.optionLocalizations('commands.moderation.pin.first'), type: Boolean},
        {name: 'channel', description: 'Channel to pin in (Default: Current Channel)', ...I18n.optionLocalizations('commands.moderation.pin.channel'), channelTypes: [ChannelTypes.GUILD_NEWS, ChannelTypes.GUILD_TEXT], type: ApplicationCommandOptionTypes.CHANNEL},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.first || !!args.message;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('pin.needs_message')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createPinMessage(context, {first: args.first, in: args.channel, query: args.message || ''});
  }
}

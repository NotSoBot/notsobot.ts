import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'channel';

export class InfoChannelCommand extends BaseInteractionCommandOption {
  description = 'Get information for a channel';
  descriptionLocalizations = I18n.localizations('commands.info.channel.description');
  metadata = {
    id: Formatter.Commands.InfoChannel.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.channel.name');

  constructor() {
    super({
      options: [
        {
          name: 'channel',
          description: 'Channel to get information for (Default: Current Channel)',
          ...I18n.optionLocalizations('commands.info.channel.channel'),
          default: (context: Interaction.InteractionContext) => Parameters.channelMetadata('', context),
          label: 'payload',
          type: ApplicationCommandOptionTypes.CHANNEL,
          value: async (channel: Structures.Channel, context: Interaction.InteractionContext) => {
            const payload = await Parameters.channelMetadata(channel.id, context);
            // fall back to the channel discord resolved for us if we can't fetch it ourselves
            if (!payload.channel) {
              payload.channel = channel;
            }
            return payload;
          },
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoChannel.CommandArgsBefore) {
    return !!args.payload.channel;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoChannel.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.channel_not_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoChannel.CommandArgs) {
    return Formatter.Commands.InfoChannel.createMessage(context, args);
  }
}

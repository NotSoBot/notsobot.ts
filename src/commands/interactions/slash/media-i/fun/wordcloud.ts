import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wordcloud';

export class MediaIWordcloudCommand extends BaseInteractionCommandOption {
  description = 'Generate a wordcloud from past messages';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.wordcloud.description');
  metadata = {
    id: Formatter.Commands.MediaICreateWordcloudChannel.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.wordcloud.name');

  constructor() {
    super({
      options: [
        {
          name: 'channel',
          description: 'Channel to read messages from (Default: Current Channel)',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.channel'),
          channelTypes: [ChannelTypes.GUILD_NEWS, ChannelTypes.GUILD_TEXT],
          default: DefaultParameters.channel,
          type: ApplicationCommandOptionTypes.CHANNEL,
        },
        {
          name: 'max',
          description: 'Amount of messages to read (1..1000) (Default: 500)',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.max'),
          default: 500,
          maxValue: 1000,
          minValue: 1,
          type: Number,
        },
        {
          name: 'before',
          description: 'Only read messages before this Message ID',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.before'),
          value: Parameters.snowflake,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateWordcloudChannel.CommandArgs) {
    return Formatter.Commands.MediaICreateWordcloudChannel.createMessage(context, args);
  }
}

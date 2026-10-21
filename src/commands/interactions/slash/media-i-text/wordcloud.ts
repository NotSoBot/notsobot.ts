import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes } from 'detritus-client/lib/constants';

import { MediaWordcloudShapes, MediaWordcloudThemes } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs extends Omit<Formatter.Commands.MediaICreateWordcloudChannel.CommandArgs, 'image'> {
  image?: Structures.Attachment,
  user?: Structures.Member | Structures.User,
}

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
          name: 'user',
          description: 'Only use this user\'s messages',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'before',
          description: 'Only read messages before this Message ID',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.before'),
          value: Parameters.snowflake,
        },
        {
          name: 'theme',
          description: 'Color theme (Default: Rainbow, or the image\'s colors)',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.theme'),
          choices: Parameters.Slash.oneOf({choices: MediaWordcloudThemes}),
        },
        {
          name: 'shape',
          description: 'Shape for the words to fill (Default: Rectangle)',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.shape'),
          choices: Parameters.Slash.oneOf({choices: MediaWordcloudShapes, defaultChoice: MediaWordcloudShapes.RECTANGLE}),
        },
        {
          name: 'image',
          description: 'Image the words fill and take the colors of (white/transparent parts stay empty)',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.image'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
        {
          name: 'exclude',
          description: 'Words to leave out, split by commas or spaces',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.exclude'),
        },
        {
          name: 'bots',
          description: 'Include messages from bots',
          ...I18n.optionLocalizations('commands.media_i.fun.wordcloud.bots'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    // the option comes back as the resolved attachment
    const image = (args.image) ? (args.image.url || args.image.proxyUrl || undefined) : undefined;
    if (args.user) {
      return Formatter.Commands.MediaICreateWordcloudUser.createMessage(context, {...args, image, user: args.user});
    }
    return Formatter.Commands.MediaICreateWordcloudChannel.createMessage(context, {...args, image});
  }
}

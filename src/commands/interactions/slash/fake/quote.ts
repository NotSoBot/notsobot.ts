import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'quote';

export interface CommandArgs {
  app?: Formatter.Commands.FunQuote.AppTag,
  color?: string,
  compact?: boolean,
  edited?: boolean,
  image?: Structures.Attachment,
  imageUrl?: string,
  light?: boolean,
  message?: Parameters.QuoteTarget,
  name?: string,
  portrait?: string,
  portraitAttachment?: Structures.Attachment,
  reactions?: Array<Parameters.Reaction>,
  text?: string,
  time?: Date,
  user?: Formatter.Commands.FunQuote.CommandArgs['user'],
}

export class QuoteCommand extends BaseInteractionCommandOption {
  description = 'Turn a message (or some text) into an image of a Discord message';
  descriptionLocalizations = I18n.localizations('commands.fun.quote.description');
  metadata = {
    id: Formatter.Commands.FunQuote.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.quote.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What it says',
          ...I18n.optionLocalizations('commands.fun.quote.text'),
        },
        {
          name: 'user',
          description: 'Who says it (their latest message without text)',
          ...I18n.optionLocalizations('commands.fun.quote.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'message',
          description: 'A message link or id to quote',
          ...I18n.optionLocalizations('commands.fun.quote.message'),
          value: Parameters.quote,
        },
        {
          name: 'name',
          description: 'The display name',
          ...I18n.optionLocalizations('commands.fun.post.name'),
          maxLength: Formatter.Commands.FunQuote.MAX_NAME_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.FunQuote.MAX_NAME_LENGTH}),
        },
        {
          name: 'portrait',
          description: 'Emoji/Image URL/User for the profile picture',
          ...I18n.optionLocalizations('commands.fun.post.portrait'),
          value: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}),
        },
        {
          name: 'portrait-attachment',
          description: 'Image File for the profile picture',
          ...I18n.optionLocalizations('commands.fun.post.portrait_attachment'),
          label: 'portraitAttachment',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
        {
          name: 'color',
          description: 'The name\'s color: a color name, #hex or r,g,b',
          ...I18n.optionLocalizations('commands.fun.quote.color'),
          maxLength: Formatter.Commands.FunQuote.MAX_COLOR_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.FunQuote.MAX_COLOR_LENGTH}),
        },
        {
          name: 'image',
          description: 'Image File shown under the text',
          ...I18n.optionLocalizations('commands.fun.post.image'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
        {
          name: 'image-url',
          description: 'Emoji/Image URL/User for the image under the text',
          ...I18n.optionLocalizations('commands.fun.post.image_url'),
          label: 'imageUrl',
          value: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}),
        },
        {
          name: 'reactions',
          description: 'Emojis with counts shown under the message, like 👍 12 😂 3.4k',
          ...I18n.optionLocalizations('commands.fun.quote.reactions'),
          value: Parameters.reactions,
        },
        {
          name: 'time',
          description: 'When it was sent, like "jan 6 2021 9:41am" or "2 hours ago" (Default: now)',
          ...I18n.optionLocalizations('commands.fun.post.time'),
          value: Parameters.timestampAny,
        },
        {
          name: 'edited',
          description: 'Show the (edited) mark',
          ...I18n.optionLocalizations('commands.fun.quote.edited'),
          type: Boolean,
        },
        {
          name: 'app',
          description: 'The APP tag after the name',
          ...I18n.optionLocalizations('commands.fun.quote.app'),
          choices: Parameters.Slash.oneOf({
            choices: {APP: 'app', VERIFIED: 'verified', NONE: 'none'},
            descriptions: {app: 'App', none: 'None', verified: 'Verified App'},
            doNotSort: true,
          }),
        },
        {
          name: 'compact',
          description: 'Discord\'s compact mode, the name inline with the text',
          ...I18n.optionLocalizations('commands.fun.quote.compact'),
          type: Boolean,
        },
        {
          name: 'light',
          description: 'Discord\'s light theme',
          ...I18n.optionLocalizations('commands.fun.quote.light'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    // an uploaded file goes before what the url option names
    const image = args.image;
    const portrait = args.portraitAttachment;
    return Formatter.Commands.FunQuote.createMessage(context, {
      app: args.app,
      color: args.color,
      compact: args.compact,
      edited: args.edited,
      image: (image) ? (image.url || image.proxyUrl || undefined) : args.imageUrl,
      light: args.light,
      message: (args.message) ? args.message.message : null,
      name: args.name,
      portrait: (portrait) ? (portrait.url || portrait.proxyUrl || undefined) : args.portrait,
      reactions: args.reactions,
      text: args.text,
      time: args.time,
      user: args.user,
    });
  }
}

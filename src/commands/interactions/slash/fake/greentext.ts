import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { countOption } from '../fake-post/post';


export const COMMAND_NAME = 'greentext';

const { MAX_NAME_LENGTH, MAX_NUMBER_LENGTH, MAX_SUBJECT_LENGTH, MAX_TEXT_LENGTH, MAX_TRIPCODE_LENGTH } = Formatter.Commands.FunGreentext;

export interface CommandArgs {
  board?: string,
  image?: Structures.Attachment,
  imageUrl?: string,
  message?: Parameters.QuoteTarget,
  name?: string,
  number?: string,
  op?: boolean,
  replies?: number,
  subject?: string,
  text?: string,
  theme?: RestOptions.MediaICreateGreentext['theme'],
  time?: Date,
  tripcode?: string,
}

// the board option is the search command's (its name is translated once), with what a board does here
function boardLocalizations(): {descriptionLocalizations?: Record<string, string>, nameLocalizations?: Record<string, string>} {
  const result: {descriptionLocalizations?: Record<string, string>, nameLocalizations?: Record<string, string>} = {};
  const name = I18n.localizations('commands.search.4chan.board.name');
  if (name) {
    result.nameLocalizations = name;
  }
  const description = I18n.localizations('commands.fun.greentext.board.description');
  if (description) {
    result.descriptionLocalizations = description;
  }
  return result;
}

export class GreentextCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a 4chan post with your own greentext, name, number and image';
  descriptionLocalizations = I18n.localizations('commands.fun.greentext.description');
  metadata = {
    id: Formatter.Commands.FunGreentext.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.greentext.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What the post says',
          ...I18n.optionLocalizations('commands.fun.post.text'),
          maxLength: MAX_TEXT_LENGTH,
          value: Parameters.string({maxLength: MAX_TEXT_LENGTH}),
        },
        {
          name: 'message',
          description: 'A message link or id: by itself it becomes the post, with text it is quoted',
          ...I18n.optionLocalizations('commands.fun.post.message'),
          value: Parameters.quote,
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
          name: 'name',
          description: 'The display name',
          ...I18n.optionLocalizations('commands.fun.post.name'),
          maxLength: MAX_NAME_LENGTH,
          value: Parameters.string({maxLength: MAX_NAME_LENGTH}),
        },
        {
          name: 'tripcode',
          description: 'The tripcode after the name, like !Ep8pui8Vw2',
          ...I18n.optionLocalizations('commands.fun.greentext.tripcode'),
          maxLength: MAX_TRIPCODE_LENGTH,
          value: Parameters.string({maxLength: MAX_TRIPCODE_LENGTH}),
        },
        {
          name: 'subject',
          description: 'The thread subject, in bold before the name',
          ...I18n.optionLocalizations('commands.fun.greentext.subject'),
          maxLength: MAX_SUBJECT_LENGTH,
          value: Parameters.string({maxLength: MAX_SUBJECT_LENGTH}),
        },
        {
          name: 'board',
          description: 'The board it is on, for its colors and post numbers (ex: g, v)',
          ...boardLocalizations(),
          value: Parameters.fourChanBoard,
          onAutoComplete: Parameters.AutoComplete.fourChanBoards,
        },
        {
          name: 'theme',
          description: 'The site\'s color theme',
          ...I18n.optionLocalizations('commands.fun.post.theme'),
          // no default here, it's the board's own
          choices: Parameters.Slash.oneOf({
            choices: {YOTSUBA: 'yotsuba', YOTSUBA_B: 'yotsuba-b'},
            descriptions: {yotsuba: 'Yotsuba', 'yotsuba-b': 'Yotsuba B'},
            doNotSort: true,
          }),
        },
        {
          name: 'number',
          description: 'The post number, up to 10 digits (Default: made up)',
          ...I18n.optionLocalizations('commands.fun.greentext.number'),
          // room for a `No.` in front
          maxLength: MAX_NUMBER_LENGTH + 4,
          value: Parameters.string({maxLength: MAX_NUMBER_LENGTH + 4}),
        },
        // the replies that link back to it, at most a few are drawn
        countOption('replies', 'How many replies, like 1234 or 12.5k (Default: made up)', 'replies'),
        {
          name: 'op',
          description: 'Draw it as the post that opened the thread (with a message, that one opens it)',
          ...I18n.optionLocalizations('commands.fun.greentext.op'),
          type: Boolean,
        },
        {
          name: 'time',
          description: 'When it was sent, like "jan 6 2021 9:41am" or "2 hours ago" (Default: now)',
          ...I18n.optionLocalizations('commands.fun.post.time'),
          value: Parameters.timestampAny,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    // an uploaded file goes before what the url option names, and its own name, size and dimensions are the file's
    const image = args.image;
    const upload = (image) ? Formatter.Commands.FunGreentext.attachmentImage(image) : null;
    return Formatter.Commands.FunGreentext.createMessage(context, {
      board: args.board,
      file: (upload) ? upload.file : undefined,
      // a file that isn't an image is still passed on, the api says it couldn't be loaded
      image: (upload) ? upload.url : ((image) ? (image.url || image.proxyUrl || undefined) : args.imageUrl),
      message: (args.message) ? args.message.message : null,
      name: args.name,
      number: args.number,
      op: args.op,
      replies: args.replies,
      subject: args.subject,
      text: args.text,
      theme: args.theme,
      time: args.time,
      tripcode: args.tripcode,
    });
  }
}

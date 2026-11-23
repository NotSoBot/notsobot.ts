import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'quote';

const { APP_TAGS, MAX_COLOR_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunQuote;

export interface CommandArgsBefore extends Formatter.Commands.FunQuote.QuoteOverrides {
  compact?: boolean,
  light?: boolean,
  target: Parameters.QuoteTarget,
}

export default class QuoteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'app', type: Parameters.flagChoice(APP_TAGS, 'app', {no: 'none', off: 'none'}), metadata: {description: 'the APP tag after the name: by itself, verified (with the check) or none'}},
        {name: 'color', aliases: ['c', 'colour'], type: Parameters.string({maxLength: MAX_COLOR_LENGTH}), metadata: {description: 'the name\'s color, a name, #hex or r,g,b'}},
        {name: 'compact', type: Boolean},
        {name: 'edited', type: Boolean, metadata: {description: 'show the (edited) mark'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'light', type: Boolean},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the display name'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the avatar'}},
        {name: 'reactions', aliases: ['r'], type: Parameters.reactions, metadata: {description: 'emojis with counts under the message, like 👍 12 😂 3.4k'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was sent, like "jan 6 2021 9:41am" or "2 hours ago"'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Turn a message (or some text) into an image of a Discord message, with any name, avatar, color, time and reactions',
        examples: [
          `${COMMAND_NAME} hello world`,
          `${COMMAND_NAME} @notsobot I'm a bot`,
          `${COMMAND_NAME} @notsobot`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
          `${COMMAND_NAME} hello world -light -compact`,
          `${COMMAND_NAME} hello world -name Some Body -color white -portrait https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} it is done -reactions 👍 12 😂 3.4k -time yesterday at 9pm -edited`,
        ],
        id: Formatter.Commands.FunQuote.COMMAND_ID,
        usage: '<text | @user [text] | message link/id> (-name <text>) (-portrait <emoji,user,url>) (-color <name|#hex|r,g,b>) (-image <url>) (-reactions <emoji count ...>) (-time <text>) (-edited) (-app <verified|none>) (-compact) (-light)',
      },
      type: Parameters.quote,
    });
  }

  // a reply with nothing else quotes the replied to message, an attached image by itself is quoted too
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.user || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunQuote.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      user: args.target.user,
    });
  }
}

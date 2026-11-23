import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'greentext';

const { MAX_NAME_LENGTH, MAX_NUMBER_LENGTH, MAX_SUBJECT_LENGTH, MAX_TRIPCODE_LENGTH } = Formatter.Commands.FunGreentext;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunGreentext.CommandArgs, 'file' | 'message' | 'text' | 'theme' | 'user'> {
  blue?: boolean,
  tan?: boolean,
  target: Parameters.QuoteTarget,
}

export default class GreentextCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      // `4chan` and `chan` search the site
      aliases: ['gt', '4chanpost'],
      args: [
        {name: 'blue', type: Boolean, metadata: {description: 'the blue theme (Yotsuba B), whatever the board'}},
        {name: 'board', aliases: ['b'], type: Parameters.fourChanBoard, metadata: {description: 'the board it\'s on, for its colors and post numbers (like g or v)'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the post\'s image (or attach one)'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the name in place of Anonymous'}},
        {name: 'number', type: Parameters.string({maxLength: MAX_NUMBER_LENGTH + 4}), metadata: {description: 'the post number, up to 10 digits'}},
        {name: 'op', type: Boolean, metadata: {description: 'the post that opened the thread (with a message: that one opens it)'}},
        {name: 'replies', type: Parameters.count, metadata: {description: 'how many replies link back to it, up to 15'}},
        {name: 'subject', aliases: ['s'], type: Parameters.string({maxLength: MAX_SUBJECT_LENGTH}), metadata: {description: 'the subject in bold before the name'}},
        {name: 'tan', type: Boolean, metadata: {description: 'the tan theme (Yotsuba), whatever the board'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        // by itself it makes one up
        {name: 'tripcode', aliases: ['trip'], type: Parameters.string({maxLength: MAX_TRIPCODE_LENGTH}), metadata: {description: 'the tripcode after the name, made up when none is given'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a 4chan post with your own greentext, name, number and image',
        examples: [
          `${COMMAND_NAME} >be me >go outside >mfw`,
          `${COMMAND_NAME} @notsobot >be bot >get used all day -number 12345677`,
          `${COMMAND_NAME} >tfw no gf -board g -name moot -tripcode -subject greentext thread -op`,
          `${COMMAND_NAME} checked -image https://cdn.nsb.gg/assets/samples/face.png -replies 5 -time yesterday at 9pm`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunGreentext.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-board <board>) (-name <text>) (-tripcode <text>) (-subject <text>) (-number <digits>) (-image <url>) (-replies) (-op) (-time <text>) (-blue) (-tan)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunGreentext.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      // the board's own unless one is asked for
      theme: (args.blue) ? 'yotsuba-b' : ((args.tan) ? 'yotsuba' : undefined),
      user: args.target.user,
    });
  }
}

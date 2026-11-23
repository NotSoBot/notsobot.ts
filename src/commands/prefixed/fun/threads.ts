import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'threads';

const { MAX_HANDLE_LENGTH } = Formatter.Commands.FunTweet;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunThreads.CommandArgs, 'message' | 'text' | 'theme' | 'user' | 'verified'> {
  light?: boolean,
  target: Parameters.QuoteTarget,
  verified?: boolean,
}

export default class ThreadsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or a real threads account\'s username (only ones shared to the fediverse can be copied)'}},
        {name: 'handle', type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'the username, the only name a post shows'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'light', type: Boolean, metadata: {description: 'threads\' light theme'}},
        {name: 'likes', type: Parameters.count, metadata: {description: 'how many likes, like 1234 or 12.5k'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'quote', type: Parameters.string({maxLength: 2048}), metadata: {description: 'a link to a real post, shown quoted under the text'}},
        {name: 'replies', type: Parameters.count, metadata: {description: 'how many replies'}},
        {name: 'reposts', type: Parameters.count, metadata: {description: 'how many reposts'}},
        {name: 'shares', type: Parameters.count, metadata: {description: 'how many shares'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        {name: 'verified', aliases: ['v'], type: Boolean, metadata: {description: 'the verified badge after the username'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a Threads post from you, someone here or a real account, with your own text, counts and badge',
        examples: [
          `${COMMAND_NAME} hello threads`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 12.5k`,
          `${COMMAND_NAME} say more -from zuck -verified`,
          `${COMMAND_NAME} hello world -handle some.body -portrait https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} good evening -time yesterday at 9pm -light`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunThreads.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-from <@user|username>) (-handle <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-replies) (-reposts) (-shares) (-verified) (-quote <post link>) (-time <text>) (-light)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunThreads.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.light) ? 'light' : 'dark',
      user: args.target.user,
      // only when asked for, the lookup has no badge to copy
      verified: (args.verified) ? 'blue' : undefined,
    });
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'bluesky';

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunTweet;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunBluesky.CommandArgs, 'message' | 'text' | 'theme' | 'user' | 'verified'> {
  dark?: boolean,
  dim?: boolean,
  target: Parameters.QuoteTarget,
  verified?: boolean,
}

export default class BlueskyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['bsky', 'skeet'],
      args: [
        {name: 'bookmarks', aliases: ['saves'], type: Parameters.count, metadata: {description: 'how many saves, like 1234 or 12.5k'}},
        {name: 'dark', type: Boolean, metadata: {description: 'bluesky\'s dark theme'}},
        {name: 'dim', type: Boolean, metadata: {description: 'bluesky\'s dim theme'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or a real bluesky account\'s handle (its name, portrait and badge are copied)'}},
        {name: 'handle', type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'the @handle under the name, one without a dot gets .bsky.social'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'likes', type: Parameters.count, metadata: {description: 'how many likes, like 1234 or 12.5k'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the display name'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'quote', type: Parameters.string({maxLength: 2048}), metadata: {description: 'a link to a real post, shown quoted under the text'}},
        {name: 'replies', type: Parameters.count, metadata: {description: 'how many replies'}},
        {name: 'replyto', type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it replies to, a user or a handle'}},
        {name: 'reposts', type: Parameters.count, metadata: {description: 'how many reposts'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        {name: 'verified', aliases: ['v'], type: Boolean, metadata: {description: 'the verified badge after the name'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a Bluesky post from you, someone here or any real account, with your own text, counts and badge',
        examples: [
          `${COMMAND_NAME} hello bluesky`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 12.5k`,
          `${COMMAND_NAME} the sky is blue -from bsky.app`,
          `${COMMAND_NAME} hello world -name Some Body -handle somebody.com -portrait https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} good evening -time yesterday at 9pm -dim`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunBluesky.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-from <@user|handle>) (-name <text>) (-handle <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-reposts) (-replies) (-saves) (-verified) (-quote <post link>) (-time <text>) (-replyto <user|handle>) (-dim) (-dark)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunBluesky.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.dark) ? 'dark' : ((args.dim) ? 'dim' : 'light'),
      user: args.target.user,
      // only when asked for, an account's own badge shows otherwise
      verified: (args.verified) ? 'blue' : undefined,
    });
  }
}

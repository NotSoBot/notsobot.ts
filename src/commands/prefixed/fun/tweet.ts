import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tweet';

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH, MAX_NOTE_LENGTH, VERIFIED_ALIASES, VERIFIED_TYPES } = Formatter.Commands.FunTweet;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunTweet.CommandArgs, 'message' | 'text' | 'theme' | 'user'> {
  dim?: boolean,
  light?: boolean,
  target: Parameters.QuoteTarget,
}

export default class TweetCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['xpost'],
      args: [
        {name: 'bookmarks', type: Parameters.count, metadata: {description: 'how many bookmarks, like 1234 or 12.5k'}},
        {name: 'dim', type: Boolean, metadata: {description: 'x\'s dim theme'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or a real x account\'s handle (its name, portrait and badge are copied)'}},
        {name: 'handle', type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'the @handle under the name'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'light', type: Boolean, metadata: {description: 'x\'s light theme'}},
        {name: 'likes', type: Parameters.count, metadata: {description: 'how many likes, like 1234 or 12.5k'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the display name'}},
        {name: 'note', type: Parameters.string({maxLength: MAX_NOTE_LENGTH}), metadata: {description: 'a community note under the post'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'quote', type: Parameters.string({maxLength: 2048}), metadata: {description: 'a link to a real post, shown quoted under the text'}},
        {name: 'replies', type: Parameters.count, metadata: {description: 'how many replies'}},
        {name: 'replyto', type: Parameters.string({maxLength: 64}), metadata: {description: 'who it replies to, a user or a handle'}},
        {name: 'reposts', aliases: ['retweets'], type: Parameters.count, metadata: {description: 'how many reposts'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        {name: 'verified', aliases: ['v'], type: Parameters.flagChoice(VERIFIED_TYPES, 'blue', VERIFIED_ALIASES), metadata: {description: 'the badge after the name: blue (by itself), gold, grey or none'}},
        {name: 'views', type: Parameters.count, metadata: {description: 'how many views'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of an X post from you, someone here or any real account, with your own text, counts and badge',
        examples: [
          `${COMMAND_NAME} just setting up my twttr`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 12.5k`,
          `${COMMAND_NAME} one small step -from NASA -time jul 20 1969 8:17pm`,
          `${COMMAND_NAME} it all started here -quote https://x.com/jack/status/20`,
          `${COMMAND_NAME} hello world -name Some Body -handle somebody -portrait https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} this is real -note No, it is not. -views 3m -light`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunTweet.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-from <@user|handle>) (-name <text>) (-handle <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-reposts) (-replies) (-views) (-bookmarks) (-verified <blue|gold|grey|none>) (-quote <post link>) (-time <text>) (-note <text>) (-replyto <user|handle>) (-light) (-dim)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunTweet.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.light) ? 'light' : ((args.dim) ? 'dim' : 'dark'),
      user: args.target.user,
    });
  }
}

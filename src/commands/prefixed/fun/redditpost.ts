import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


// `reddit` is the search command
export const COMMAND_NAME = 'redditpost';

const { MAX_HANDLE_LENGTH } = Formatter.Commands.FunTweet;
const { MAX_FLAIR_LENGTH, MAX_SUBREDDIT_LENGTH, MAX_TITLE_LENGTH } = Formatter.Commands.FunReddit;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunReddit.CommandArgs, 'message' | 'text' | 'theme' | 'user'> {
  dark?: boolean,
  light?: boolean,
  target: Parameters.QuoteTarget,
}

export default class RedditPostCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['fakereddit', 'rpost'],
      args: [
        {name: 'comments', type: Parameters.count, metadata: {description: 'how many comments a post has, like 1234 or 12.5k'}},
        {name: 'dark', type: Boolean, metadata: {description: 'the dark theme (the default without -layout old, night mode with it)'}},
        {name: 'flair', type: Parameters.string({maxLength: MAX_FLAIR_LENGTH}), metadata: {description: 'the flair under a post\'s title'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or any name typed as is'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'layout', type: Parameters.postLayout('old'), metadata: {description: 'which look: new (today\'s, the default) or old (old.reddit.com)'}},
        {name: 'light', type: Boolean, metadata: {description: 'the light theme (the default with -layout old)'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'the name after u/'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'subreddit', aliases: ['sub', 'r'], type: Parameters.string({maxLength: MAX_SUBREDDIT_LENGTH + 3}), metadata: {description: 'the community a post is in, like r/pics (its own profile without one)'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        {name: 'title', type: Parameters.string({maxLength: MAX_TITLE_LENGTH}), metadata: {description: 'a title makes it a post instead of a comment'}},
        {name: 'upvotes', aliases: ['score', 'votes'], type: Parameters.signedCount, metadata: {description: 'the score, like 1234, 12.5k or -40'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a Reddit comment, or with a title a Reddit post, from you, someone here or any name, with your own text and score',
        examples: [
          `${COMMAND_NAME} this is the way`,
          `${COMMAND_NAME} @notsobot I'm a bot -upvotes -40`,
          `${COMMAND_NAME} -title TIL a bot can post here -sub todayilearned -flair Bot -upvotes 12.5k`,
          `${COMMAND_NAME} he sat like this all day -title My cat today -r aww -image https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} I can't believe it either -title It finally happened -from Some_Name -time 3 days ago -layout old`,
          `${COMMAND_NAME} night mode gang -upvotes 420 -layout old -dark`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000 underrated comment`,
        ],
        id: Formatter.Commands.FunReddit.COMMAND_ID,
        usage: '<text | @user [text] | message link [reply text]> (-title <text>) (-subreddit <name>) (-flair <text>) (-from <@user|name>) (-name <text>) (-portrait <emoji,user,url>) (-image <url>) (-upvotes) (-comments) (-time <text>) (-dark) (-light) (-layout <old|new>)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply, an attached image or a title with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || args.title || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunReddit.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      // without either it's the theme the look is known by: dark, or light on old reddit
      theme: (args.dark) ? 'dark' : ((args.light) ? 'light' : undefined),
      user: args.target.user,
    });
  }
}

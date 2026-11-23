import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'mastodon';

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunTweet;

// its two looks by the version that draws them
const LAYOUT_ALIASES: Record<string, 'old' | 'new'> = {'4': 'old', '4.x': 'old', 'v4': 'old', '5': 'new', '5.0': 'new', 'v5': 'new'};

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunMastodon.CommandArgs, 'message' | 'reposts' | 'text' | 'theme' | 'user'> {
  boosts?: number,
  light?: boolean,
  target: Parameters.QuoteTarget,
}

export default class MastodonCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['toot', 'masto'],
      args: [
        {name: 'boosts', aliases: ['reposts'], type: Parameters.count, metadata: {description: 'how many boosts'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or a real account as user or user@server (its name and portrait are copied)'}},
        {name: 'handle', type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'the @handle under the name, user or user@server (one without a server gets @mastodon.social)'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'layout', type: Parameters.postLayout('new', LAYOUT_ALIASES), metadata: {description: 'which look: old (mastodon 4.x, the default) or new (5.0: a round avatar, hearts, every count in one line), also 4 or 5'}},
        {name: 'light', type: Boolean, metadata: {description: 'mastodon\'s light theme'}},
        {name: 'likes', aliases: ['favourites', 'favorites', 'favs'], type: Parameters.count, metadata: {description: 'how many favorites (likes on 5.0), like 1234 or 12.5k'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the display name'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'quote', type: Parameters.string({maxLength: 2048}), metadata: {description: 'a link to a real post, shown quoted under the text'}},
        {name: 'quotes', type: Parameters.count, metadata: {description: 'how many quotes'}},
        {name: 'replies', type: Parameters.count, metadata: {description: 'how many replies (only -layout new shows them)'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a Mastodon post from you, someone here or a real account on any server, with your own text and counts',
        examples: [
          `${COMMAND_NAME} hello fediverse`,
          `${COMMAND_NAME} @notsobot I'm a bot -likes 12.5k -boosts 3k`,
          `${COMMAND_NAME} the web is ours -from Gargron`,
          `${COMMAND_NAME} new release today -from kde@floss.social`,
          `${COMMAND_NAME} hello world -name Some Body -handle somebody@example.social -portrait https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} good evening -time yesterday at 9pm -light`,
          `${COMMAND_NAME} trying out the new look -layout new -replies 12`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunMastodon.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-from <@user|user@server>) (-name <text>) (-handle <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-boosts) (-replies) (-quotes) (-quote <post link>) (-time <text>) (-light) (-layout <old|new>)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunMastodon.createMessage(context, {
      ...args,
      message: args.target.message,
      reposts: args.boosts,
      text: args.target.text,
      theme: (args.light) ? 'light' : 'dark',
      user: args.target.user,
    });
  }
}

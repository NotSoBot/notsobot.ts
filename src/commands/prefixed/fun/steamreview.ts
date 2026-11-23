import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


// `steam` is the search command
export const COMMAND_NAME = 'steamreview';

const { MAX_NAME_LENGTH } = Formatter.Commands.FunTweet;
const { MAX_FROM_LENGTH, MAX_GAME_LENGTH } = Formatter.Commands.FunSteamreview;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunSteamreview.CommandArgs, 'message' | 'recommended' | 'text' | 'user'> {
  no?: boolean,
  target: Parameters.QuoteTarget,
}

export default class SteamReviewCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['steamrev', 'sreview'],
      args: [
        {name: 'early', type: Boolean, metadata: {description: 'the Early Access Review tag'}},
        {name: 'free', type: Boolean, metadata: {description: 'the "Product received for free" line'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_FROM_LENGTH}), metadata: {description: 'who wrote it: a @mention, or a real steam profile by its custom url, id or link (its name and portrait are copied)'}},
        {name: 'funny', type: Parameters.count, metadata: {description: 'how many found it funny, like 1234 or 12.5k (0 hides the line)'}},
        {name: 'game', aliases: ['g'], type: Parameters.string({maxLength: MAX_GAME_LENGTH}), metadata: {description: 'the game it reviews, shown above it: a name, a steam app id or a store link (a made up name works too)'}},
        {name: 'helpful', type: Parameters.count, metadata: {description: 'how many found it helpful, like 1234 or 12.5k (0 hides the line)'}},
        {name: 'hours', type: Parameters.hours, metadata: {description: 'hours on record, like 0.3, 12 hrs or 4,812.5'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the profile name'}},
        {name: 'no', aliases: ['notrecommended', 'down'], type: Boolean, metadata: {description: 'Not Recommended, a thumbs down'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'products', type: Parameters.count, metadata: {description: 'how many games the account owns (0 hides the line)'}},
        {name: 'reviews', type: Parameters.count, metadata: {description: 'how many reviews the account wrote'}},
        {name: 'reviewtime', type: Parameters.hours, metadata: {description: 'hours at review time, shown after the hours on record'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021" or "2 days ago"'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a Steam review from you, someone here or any real Steam profile, with your own text, game, hours and thumb',
        examples: [
          `${COMMAND_NAME} best game I have ever played`,
          `${COMMAND_NAME} this game ruined my life -game Portal 2 -hours 4,812.5`,
          `${COMMAND_NAME} @notsobot I'm a bot -no -hours 0.3 -funny 1.2k`,
          `${COMMAND_NAME} would play again -game 620 -reviewtime 12 hrs -helpful 2069 -early`,
          `${COMMAND_NAME} the cake is a lie -from gabelogannewell -game Portal -free`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunSteamreview.COMMAND_ID,
        usage: '<text | @user [text] | message link> (-game <name|app id|store link>) (-no) (-hours <hours>) (-reviewtime <hours>) (-from <@user|profile>) (-name <text>) (-portrait <emoji,user,url>) (-helpful) (-funny) (-products) (-reviews) (-free) (-early) (-time <text>)',
      },
      type: Parameters.postTarget,
    });
  }

  // a review needs text: typed, or a message's (replied to or linked)
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunSteamreview.createMessage(context, {
      ...args,
      message: args.target.message,
      recommended: !args.no,
      text: args.target.text,
      user: args.target.user,
    });
  }
}

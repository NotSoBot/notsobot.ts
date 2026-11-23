import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tiktok';

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunTweet;
const { CREATOR_ALIASES, CREATOR_MARKS } = Formatter.Commands.FunTiktok;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunTiktok.CommandArgs, 'message' | 'text' | 'theme' | 'user' | 'verified'> {
  dark?: boolean,
  target: Parameters.QuoteTarget,
  verified?: boolean,
}

export default class TiktokCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tiktokcomment', 'ttcomment'],
      args: [
        {name: 'creator', type: Parameters.flagChoice(CREATOR_MARKS, 'tag', CREATOR_ALIASES), metadata: {description: 'the Creator tag after the name (by itself), or liked for the "Liked by creator" pill'}},
        {name: 'dark', type: Boolean, metadata: {description: 'tiktok\'s dark theme'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or a real tiktok account\'s handle (its nickname, portrait and badge are copied)'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'a photo under the comment, or what the sticker is over (or attach one)'}},
        {name: 'likes', type: Parameters.count, metadata: {description: 'how many likes, like 1234 or 12.5k'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the nickname'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'replies', type: Parameters.count, metadata: {description: 'how many replies, for the "View replies" line (0 hides it)'}},
        {name: 'sticker', type: Boolean, metadata: {description: 'the "Reply to comment" sticker from videos instead, over the image when there is one'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was left, like "jan 6 2021 9:41am" or "2 hours ago" (made up without it)'}},
        {name: 'verified', aliases: ['v'], type: Boolean, metadata: {description: 'the verified badge after the name'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a TikTok comment from you, someone here or any real account, or the reply sticker creators put on videos',
        examples: [
          `${COMMAND_NAME} first`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 12.5k`,
          `${COMMAND_NAME} no words needed -from khaby.lame -replies 986`,
          `${COMMAND_NAME} thanks for watching -creator -dark`,
          `${COMMAND_NAME} this deserves more likes -creator liked -time 2 days ago`,
          `${COMMAND_NAME} can you show how you made it -sticker`,
          `${COMMAND_NAME} do the back too -sticker -image https://cdn.nsb.gg/assets/samples/photo.jpg`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunTiktok.COMMAND_ID,
        usage: '<text | @user [text] | message link [reply text]> (-from <@user|handle>) (-name <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-replies) (-time <text>) (-verified) (-creator <tag|liked>) (-sticker) (-dark)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunTiktok.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.dark) ? 'dark' : 'light',
      user: args.target.user,
      // only when asked for, an account's own badge shows otherwise
      verified: (args.verified) ? 'blue' : undefined,
    });
  }
}

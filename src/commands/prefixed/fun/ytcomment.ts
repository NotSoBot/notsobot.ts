import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ytcomment';

const { MAX_HANDLE_LENGTH } = Formatter.Commands.FunTweet;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunYtcomment.CommandArgs, 'message' | 'text' | 'theme' | 'user' | 'verified'> {
  light?: boolean,
  target: Parameters.QuoteTarget,
  verified?: boolean,
}

export default class YtcommentCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['youtubecomment', 'ytc'],
      args: [
        {name: 'creator', type: Boolean, metadata: {description: 'the commenter is the video\'s creator (the pill around the handle)'}},
        {name: 'edited', type: Boolean, metadata: {description: 'show the (edited) mark'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or a real youtube channel\'s handle (its handle, portrait and badge are copied)'}},
        {name: 'handle', type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'the @handle, the only name a comment shows'}},
        {name: 'heart', type: Boolean, metadata: {description: 'the creator\'s heart'}},
        {name: 'light', type: Boolean, metadata: {description: 'youtube\'s light theme'}},
        {name: 'likes', type: Parameters.count, metadata: {description: 'how many likes, like 1234 or 12.5k'}},
        {name: 'pinned', type: Boolean, metadata: {description: 'the "Pinned by" line over it'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'replies', type: Parameters.count, metadata: {description: 'how many replies'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was left, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        {name: 'verified', aliases: ['v'], type: Boolean, metadata: {description: 'the verified check after the handle'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a YouTube comment from you, someone here or any real channel, with your own text, likes and badges',
        examples: [
          `${COMMAND_NAME} first`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 12.5k`,
          `${COMMAND_NAME} who's here in 2026 -from MrBeast -heart -pinned`,
          `${COMMAND_NAME} thanks for watching -creator -heart -replies 986`,
          `${COMMAND_NAME} 0:16 is the best part -time 2 years ago -edited -light`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunYtcomment.COMMAND_ID,
        usage: '<text | @user [text] | message link [reply text]> (-from <@user|handle>) (-handle <text>) (-portrait <emoji,user,url>) (-likes) (-replies) (-time <text>) (-edited) (-verified) (-heart) (-pinned) (-creator) (-light)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply to a message with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunYtcomment.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.light) ? 'light' : 'dark',
      user: args.target.user,
      // only when asked for, a channel's own badge shows otherwise
      verified: (args.verified) ? 'blue' : undefined,
    });
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'instagram';

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunTweet;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunInstagram.CommandArgs, 'message' | 'text' | 'theme' | 'user' | 'verified'> {
  dark?: boolean,
  target: Parameters.QuoteTarget,
  verified?: boolean,
}

export default class InstagramCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ig', 'insta'],
      args: [
        {name: 'comments', type: Parameters.count, metadata: {description: 'how many comments a post has, like 1234 or 12.5k'}},
        {name: 'dark', type: Boolean, metadata: {description: 'instagram\'s dark theme'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or any name typed as is'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the picture, which makes it a post instead of a comment (or attach one)'}},
        {name: 'likes', type: Parameters.count, metadata: {description: 'how many likes, like 1234 or 12.5k'}},
        {name: 'name', aliases: ['n', 'username'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the username shown'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        {name: 'verified', aliases: ['v'], type: Boolean, metadata: {description: 'the verified badge after the name'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of an Instagram post (with a picture) or comment (without one) from you, someone here or any name',
        examples: [
          `${COMMAND_NAME} first`,
          `${COMMAND_NAME} golden hour -image https://cdn.nsb.gg/assets/samples/face.png -likes 12.5k -comments 48`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 300`,
          `${COMMAND_NAME} link in bio -from some.body -portrait https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} good evening -time yesterday at 9pm -dark`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunInstagram.COMMAND_ID,
        usage: '<text | @user [text] | message link [comment text]> (-from <@user|name>) (-username <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-comments) (-verified) (-time <text>) (-dark)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunInstagram.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.dark) ? 'dark' : 'light',
      user: args.target.user,
      verified: (args.verified) ? 'blue' : undefined,
    });
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'facebook';

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunTweet;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunFacebook.CommandArgs, 'message' | 'text' | 'theme' | 'user' | 'verified'> {
  dark?: boolean,
  target: Parameters.QuoteTarget,
  verified?: boolean,
}

export default class FacebookCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['fb'],
      args: [
        {name: 'comments', type: Parameters.count, metadata: {description: 'how many comments, like 1234 or 12.5k'}},
        {name: 'dark', type: Boolean, metadata: {description: 'facebook\'s dark theme'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or any name typed as is'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'layout', type: Parameters.postLayout('old'), metadata: {description: 'which look: new (today\'s, the default) or old (a line of counts over Like, Comment and Share buttons)'}},
        {name: 'likes', type: Parameters.count, metadata: {description: 'how many reactions in all, like 1234 or 12.5k'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the name shown'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'reactions', aliases: ['r'], type: Parameters.reactions, metadata: {description: 'which reactions show, like 👍 ❤️ 😂 (with counts they add up to the total: 👍 12 😂 3.4k)'}},
        {name: 'shares', type: Parameters.count, metadata: {description: 'how many shares'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago"'}},
        {name: 'verified', aliases: ['v'], type: Boolean, metadata: {description: 'the verified badge after the name'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a Facebook post from you, someone here or any name, with your own text, counts and reactions',
        examples: [
          `${COMMAND_NAME} just setting up my facebook`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 12.5k`,
          `${COMMAND_NAME} family reunion was great -from Aunt Linda -comments 48 -shares 3`,
          `${COMMAND_NAME} who did this -reactions 😂 3.4k 😮 120 😡 12`,
          `${COMMAND_NAME} good evening -time yesterday at 9pm -dark`,
          `${COMMAND_NAME} remember when it looked like this -layout old`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunFacebook.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-from <@user|name>) (-name <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-comments) (-shares) (-reactions <emoji count ...>) (-verified) (-time <text>) (-dark) (-layout <old|new>)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunFacebook.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.dark) ? 'dark' : 'light',
      user: args.target.user,
      verified: (args.verified) ? 'blue' : undefined,
    });
  }
}

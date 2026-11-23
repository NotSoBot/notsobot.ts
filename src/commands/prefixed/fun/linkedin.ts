import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'linkedin';

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunTweet;
const { DEGREES, DEGREE_ALIASES, MAX_HEADLINE_LENGTH } = Formatter.Commands.FunLinkedin;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunLinkedin.CommandArgs, 'message' | 'text' | 'theme' | 'user' | 'verified'> {
  dark?: boolean,
  target: Parameters.QuoteTarget,
  verified?: boolean,
}

export default class LinkedinCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['fakelinkedin', 'lnkd'],
      args: [
        {name: 'comments', type: Parameters.count, metadata: {description: 'how many comments, like 1234 or 12.5k'}},
        {name: 'dark', type: Boolean, metadata: {description: 'linkedin\'s dark theme'}},
        {name: 'degree', type: Parameters.flagChoice(DEGREES, '1st', DEGREE_ALIASES), metadata: {description: 'how connected they are, after the name: 1st (by itself, no Follow), 2nd, 3rd or none'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}), metadata: {description: 'who it\'s from: a @mention, or any name typed as is'}},
        {name: 'headline', aliases: ['title', 'job'], type: Parameters.string({maxLength: MAX_HEADLINE_LENGTH}), metadata: {description: 'the job line under the name, a made-up job without it'}},
        {name: 'image', aliases: ['i'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'an image under the text (or attach one)'}},
        {name: 'layout', type: Parameters.postLayout('old'), metadata: {description: 'which look: new (today\'s, the default) or old (a line of counts over Like, Comment, Repost and Send buttons)'}},
        {name: 'likes', aliases: ['reactions'], type: Parameters.count, metadata: {description: 'how many reactions, like 1234 or 12.5k'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the display name'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}), metadata: {description: 'the profile picture'}},
        {name: 'reposts', type: Parameters.count, metadata: {description: 'how many reposts'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'when it was posted, like "jan 6 2021 9:41am" or "2 hours ago", made up without it'}},
        {name: 'verified', aliases: ['v'], type: Boolean, metadata: {description: 'the verified shield after the name'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a LinkedIn post from you, someone here or any name, with your own text, headline and reactions. Everyone gets a made-up job unless you set one',
        examples: [
          `${COMMAND_NAME} I'm thrilled to announce`,
          `${COMMAND_NAME} @notsobot I'm a bot -verified -likes 12.5k`,
          `${COMMAND_NAME} Agree? -from Some Body -headline CEO of Everything -degree 3rd`,
          `${COMMAND_NAME} here's what it taught me about B2B sales -degree -comments 48 -reposts 3`,
          `${COMMAND_NAME} we're hiring -image https://cdn.nsb.gg/assets/samples/face.png -time 2 days ago -dark`,
          `${COMMAND_NAME} back when everyone could see the counts -layout old`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunLinkedin.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-from <@user|name>) (-name <text>) (-headline <text>) (-portrait <emoji,user,url>) (-image <url>) (-likes) (-comments) (-reposts) (-degree <1st|2nd|3rd|none>) (-verified) (-time <text>) (-dark) (-layout <old|new>)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply or an attached image with nothing else is enough
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text || context.message.attachments.length);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunLinkedin.createMessage(context, {
      ...args,
      message: args.target.message,
      text: args.target.text,
      theme: (args.dark) ? 'dark' : 'light',
      user: args.target.user,
      // only when asked for
      verified: (args.verified) ? 'blue' : undefined,
    });
  }
}

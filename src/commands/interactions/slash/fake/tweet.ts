import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions } from './post';


export const COMMAND_NAME = 'tweet';

export interface CommandArgs extends PostCommandArgs {
  bookmarks?: number,
  note?: string,
  replies?: number,
  reposts?: number,
  theme?: RestOptions.MediaICreateTweet['theme'],
  verified?: RestOptions.MediaICreatePostVerified,
  views?: number,
}

export class TweetCommand extends BaseInteractionCommandOption {
  description = 'Make an image of an X post from anyone, with your own text, counts and badge';
  descriptionLocalizations = I18n.localizations('commands.fun.tweet.description');
  metadata = {
    id: Formatter.Commands.FunTweet.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.tweet.name');

  constructor() {
    super({
      options: [
        ...postOptions(),
        countOption('reposts', 'How many reposts, like 1234 or 12.5k (Default: made up)', 'reposts'),
        countOption('replies', 'How many replies, like 1234 or 12.5k (Default: made up)', 'replies'),
        countOption('views', 'How many views, like 1234 or 1.2m (Default: made up)', 'views'),
        countOption('bookmarks', 'How many bookmarks, like 1234 or 12.5k (Default: made up)', 'bookmarks'),
        {
          name: 'verified',
          description: 'The verified badge after the name',
          ...I18n.optionLocalizations('commands.fun.post.verified'),
          choices: Parameters.Slash.oneOf({
            choices: {BLUE: 'blue', GOLD: 'gold', GREY: 'grey', NONE: 'none'},
            descriptions: {blue: 'Blue', gold: 'Gold (business)', grey: 'Grey (government)', none: 'None'},
            doNotSort: true,
          }),
        },
        {
          name: 'theme',
          description: 'The site\'s color theme',
          ...I18n.optionLocalizations('commands.fun.post.theme'),
          choices: Parameters.Slash.oneOf({
            choices: {DARK: 'dark', DIM: 'dim', LIGHT: 'light'},
            defaultChoice: 'dark',
            doNotSort: true,
          }),
        },
        {
          name: 'note',
          description: 'A community note shown under the post',
          ...I18n.optionLocalizations('commands.fun.post.note'),
          maxLength: Formatter.Commands.FunTweet.MAX_NOTE_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.FunTweet.MAX_NOTE_LENGTH}),
        },
        ...postEndOptions(),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunTweet.createMessage(context, {
      ...postArgs(args),
      bookmarks: args.bookmarks,
      note: args.note,
      replies: args.replies,
      reposts: args.reposts,
      theme: args.theme,
      verified: args.verified,
      views: args.views,
    });
  }
}

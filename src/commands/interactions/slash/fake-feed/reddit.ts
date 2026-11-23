import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions, layoutOption } from '../fake-post/post';


export const COMMAND_NAME = 'reddit';

const { MAX_FLAIR_LENGTH, MAX_SUBREDDIT_LENGTH, MAX_TITLE_LENGTH } = Formatter.Commands.FunReddit;

export interface CommandArgs extends PostCommandArgs {
  comments?: number,
  flair?: string,
  subreddit?: string,
  layout?: RestOptions.MediaICreatePostLayout,
  theme?: RestOptions.MediaICreateReddit['theme'],
  title?: string,
  upvotes?: number,
}

export class RedditCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Reddit post or comment from anyone, with your own title, text and score';
  descriptionLocalizations = I18n.localizations('commands.fun.reddit.description');
  metadata = {
    id: Formatter.Commands.FunReddit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.reddit.name');

  constructor() {
    // reddit has no accounts to look up and one name (`name`), its score has its own option
    const [ text, ...shared ] = postOptions(null, ['handle', 'likes']);
    super({
      options: [
        text,
        {
          name: 'title',
          description: 'A title makes it a post instead of a comment',
          ...I18n.optionLocalizations('commands.fun.reddit.title'),
          maxLength: MAX_TITLE_LENGTH,
          value: Parameters.string({maxLength: MAX_TITLE_LENGTH}),
        },
        ...shared,
        {
          name: 'subreddit',
          description: 'The community a post is in, like r/pics (Default: their own profile)',
          ...I18n.optionLocalizations('commands.fun.reddit.subreddit'),
          maxLength: MAX_SUBREDDIT_LENGTH + 3,
          value: Parameters.string({maxLength: MAX_SUBREDDIT_LENGTH + 3}),
        },
        {
          name: 'upvotes',
          description: 'The score, like 1234, 12.5k or -40 (Default: made up)',
          ...I18n.optionLocalizations('commands.fun.reddit.upvotes'),
          maxLength: 17,
          value: Parameters.signedCount,
        },
        countOption('comments', 'How many comments, like 1234 or 12.5k (Default: made up)', 'comments'),
        {
          name: 'flair',
          description: 'The flair under a post\'s title',
          ...I18n.optionLocalizations('commands.fun.reddit.flair'),
          maxLength: MAX_FLAIR_LENGTH,
          value: Parameters.string({maxLength: MAX_FLAIR_LENGTH}),
        },
        {
          name: 'theme',
          description: 'The site\'s color theme',
          ...I18n.optionLocalizations('commands.fun.post.theme'),
          choices: Parameters.Slash.oneOf({
            choices: {DARK: 'dark', LIGHT: 'light'},
            defaultChoice: 'dark',
            doNotSort: true,
          }),
        },
        // old reddit has the one color, the theme is only for today's site
        layoutOption('new'),
        ...postEndOptions(['reply-to']),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunReddit.createMessage(context, {
      ...postArgs(args),
      comments: args.comments,
      flair: args.flair,
      subreddit: args.subreddit,
      layout: args.layout,
      theme: args.theme,
      title: args.title,
      upvotes: args.upvotes,
    });
  }
}

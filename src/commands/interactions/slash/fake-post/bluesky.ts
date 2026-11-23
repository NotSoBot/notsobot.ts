import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions, quoteOption } from './post';


export const COMMAND_NAME = 'bluesky';

export interface CommandArgs extends PostCommandArgs {
  bookmarks?: number,
  replies?: number,
  reposts?: number,
  theme?: RestOptions.MediaICreateBluesky['theme'],
  verified?: boolean,
}

export class BlueskyCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Bluesky post from anyone, with your own text, counts and badge';
  descriptionLocalizations = I18n.localizations('commands.fun.bluesky.description');
  metadata = {
    id: Formatter.Commands.FunBluesky.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.bluesky.name');

  constructor() {
    super({
      options: [
        ...postOptions('bluesky'),
        countOption('reposts', 'How many reposts, like 1234 or 12.5k (Default: made up)', 'reposts'),
        countOption('replies', 'How many replies, like 1234 or 12.5k (Default: made up)', 'replies'),
        // bluesky calls them saves, the option is the same one `tweet` has
        countOption('bookmarks', 'How many bookmarks, like 1234 or 12.5k (Default: made up)', 'bookmarks'),
        {
          name: 'verified',
          description: 'The verified badge after the name',
          ...I18n.optionLocalizations('commands.fun.post.verified'),
          type: Boolean,
        },
        {
          name: 'theme',
          description: 'The site\'s color theme',
          ...I18n.optionLocalizations('commands.fun.post.theme'),
          choices: Parameters.Slash.oneOf({
            choices: {LIGHT: 'light', DIM: 'dim', DARK: 'dark'},
            defaultChoice: 'light',
            doNotSort: true,
          }),
        },
        quoteOption(),
        ...postEndOptions(),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunBluesky.createMessage(context, {
      ...postArgs(args),
      bookmarks: args.bookmarks,
      replies: args.replies,
      reposts: args.reposts,
      theme: args.theme,
      // the account's own badge shows unless it's said either way
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

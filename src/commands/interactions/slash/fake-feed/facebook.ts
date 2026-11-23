import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions, layoutOption } from '../fake-post/post';


export const COMMAND_NAME = 'facebook';

export interface CommandArgs extends PostCommandArgs {
  comments?: number,
  reactions?: Array<Parameters.Reaction>,
  shares?: number,
  layout?: RestOptions.MediaICreatePostLayout,
  theme?: RestOptions.MediaICreateFacebook['theme'],
  verified?: boolean,
}

export class FacebookCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Facebook post from anyone, with your own text, counts and reactions';
  descriptionLocalizations = I18n.localizations('commands.fun.facebook.description');
  metadata = {
    id: Formatter.Commands.FunFacebook.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.facebook.name');

  constructor() {
    super({
      options: [
        // facebook has no accounts to look up and shows one name, `likes` is every reaction together
        ...postOptions(null, ['handle']),
        countOption('comments', 'How many comments, like 1234 or 12.5k (Default: made up)', 'comments'),
        {
          name: 'shares',
          description: 'How many shares, like 1234 or 12.5k (Default: made up)',
          ...I18n.optionLocalizations('commands.fun.facebook.shares'),
          maxLength: 16,
          value: Parameters.count,
        },
        {
          // `quote`'s option: here the emojis pick the reaction discs, and their counts add up to the total
          name: 'reactions',
          description: 'Emojis with counts shown under the message, like 👍 12 😂 3.4k',
          ...I18n.optionLocalizations('commands.fun.quote.reactions'),
          value: Parameters.reactions,
        },
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
            choices: {LIGHT: 'light', DARK: 'dark'},
            defaultChoice: 'light',
            doNotSort: true,
          }),
        },
        layoutOption('new'),
        ...postEndOptions(['reply-to']),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunFacebook.createMessage(context, {
      ...postArgs(args),
      comments: args.comments,
      reactions: args.reactions,
      shares: args.shares,
      layout: args.layout,
      theme: args.theme,
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

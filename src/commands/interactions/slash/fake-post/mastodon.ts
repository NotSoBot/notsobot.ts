import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions, layoutOption, quoteOption } from './post';


export const COMMAND_NAME = 'mastodon';

export interface CommandArgs extends PostCommandArgs {
  replies?: number,
  reposts?: number,
  layout?: RestOptions.MediaICreatePostLayout,
  theme?: RestOptions.MediaICreateMastodon['theme'],
}

export class MastodonCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Mastodon post from anyone on any server, with your own text and counts';
  descriptionLocalizations = I18n.localizations('commands.fun.mastodon.description');
  metadata = {
    id: Formatter.Commands.FunMastodon.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.mastodon.name');

  constructor() {
    super({
      options: [
        ...postOptions('mastodon'),
        // mastodon calls them boosts, the option is the same one the other sites have
        countOption('reposts', 'How many reposts, like 1234 or 12.5k (Default: made up)', 'reposts'),
        countOption('replies', 'How many replies, like 1234 or 12.5k (Default: made up)', 'replies'),
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
        // its looks go by the version that draws them
        layoutOption('old', {old: 'Old (4.x)', new: 'New (5.0)'}),
        quoteOption(),
        ...postEndOptions(['reply-to']),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const { replyto, ...post } = postArgs(args);
    return Formatter.Commands.FunMastodon.createMessage(context, {
      ...post,
      replies: args.replies,
      reposts: args.reposts,
      layout: args.layout,
      theme: args.theme,
    });
  }
}

import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions } from '../fake-post/post';


export const COMMAND_NAME = 'ytcomment';

export interface CommandArgs extends PostCommandArgs {
  creator?: boolean,
  edited?: boolean,
  heart?: boolean,
  pinned?: boolean,
  replies?: number,
  theme?: RestOptions.MediaICreateYoutubeComment['theme'],
  verified?: boolean,
}

export class YtcommentCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a YouTube comment from anyone, with your own text, likes and badges';
  descriptionLocalizations = I18n.localizations('commands.fun.ytcomment.description');
  metadata = {
    id: Formatter.Commands.FunYtcomment.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.ytcomment.name');

  constructor() {
    super({
      options: [
        // a comment shows only its handle and has no image
        ...postOptions('youtube', ['name', 'image', 'image-url']),
        countOption('replies', 'How many replies, like 1234 or 12.5k (Default: made up)', 'replies'),
        {
          name: 'edited',
          description: 'Show the (edited) mark',
          ...I18n.optionLocalizations('commands.fun.quote.edited'),
          type: Boolean,
        },
        {
          name: 'verified',
          description: 'The verified badge after the name',
          ...I18n.optionLocalizations('commands.fun.post.verified'),
          type: Boolean,
        },
        {
          name: 'heart',
          description: 'The creator\'s heart next to the likes',
          ...I18n.optionLocalizations('commands.fun.ytcomment.heart'),
          type: Boolean,
        },
        {
          name: 'pinned',
          description: 'Show the "Pinned by" line above the comment',
          ...I18n.optionLocalizations('commands.fun.ytcomment.pinned'),
          type: Boolean,
        },
        {
          name: 'creator',
          description: 'The commenter is the video\'s creator (the pill around the handle)',
          ...I18n.optionLocalizations('commands.fun.ytcomment.creator'),
          type: Boolean,
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
        ...postEndOptions(['reply-to']),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunYtcomment.createMessage(context, {
      ...postArgs(args),
      creator: args.creator,
      edited: args.edited,
      heart: args.heart,
      pinned: args.pinned,
      replies: args.replies,
      theme: args.theme,
      // the channel's own badge shows unless it's said either way
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

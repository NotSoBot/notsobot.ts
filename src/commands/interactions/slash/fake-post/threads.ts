import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions, quoteOption } from './post';


export const COMMAND_NAME = 'threads';

export interface CommandArgs extends PostCommandArgs {
  replies?: number,
  reposts?: number,
  theme?: RestOptions.MediaICreateThreads['theme'],
  verified?: boolean,
}

export class ThreadsCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Threads post from anyone, with your own text, counts and badge';
  descriptionLocalizations = I18n.localizations('commands.fun.threads.description');
  metadata = {
    id: Formatter.Commands.FunThreads.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.threads.name');

  constructor() {
    super({
      options: [
        // a threads post shows the username alone, there's no display name to set
        ...postOptions('threads', ['name']),
        countOption('replies', 'How many replies, like 1234 or 12.5k (Default: made up)', 'replies'),
        countOption('reposts', 'How many reposts, like 1234 or 12.5k (Default: made up)', 'reposts'),
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
            choices: {DARK: 'dark', LIGHT: 'light'},
            defaultChoice: 'dark',
            doNotSort: true,
          }),
        },
        quoteOption(),
        ...postEndOptions(['reply-to']),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const { name, replyto, ...post } = postArgs(args);
    return Formatter.Commands.FunThreads.createMessage(context, {
      ...post,
      replies: args.replies,
      reposts: args.reposts,
      theme: args.theme,
      // the lookup has no badge to copy, it shows when asked for
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

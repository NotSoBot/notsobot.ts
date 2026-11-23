import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postOptions, layoutOption } from '../fake-post/post';


export const COMMAND_NAME = 'linkedin';

const { MAX_HEADLINE_LENGTH } = Formatter.Commands.FunLinkedin;

export interface CommandArgs extends PostCommandArgs {
  comments?: number,
  degree?: RestOptions.MediaICreateLinkedinDegree,
  headline?: string,
  reposts?: number,
  layout?: RestOptions.MediaICreatePostLayout,
  theme?: RestOptions.MediaICreateLinkedin['theme'],
  verified?: boolean,
}

export class LinkedinCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a LinkedIn post from anyone, with your own text, headline and reactions';
  descriptionLocalizations = I18n.localizations('commands.fun.linkedin.description');
  metadata = {
    id: Formatter.Commands.FunLinkedin.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.linkedin.name');

  constructor() {
    // linkedin has no accounts to look up and no handles, the headline goes right after the name it's under
    const shared = postOptions(null, ['handle']);
    const afterName = shared.findIndex((option) => option.name === 'name') + 1;
    super({
      options: [
        ...shared.slice(0, afterName),
        {
          name: 'headline',
          description: 'The job line under the name (Default: a made-up job)',
          ...I18n.optionLocalizations('commands.fun.linkedin.headline'),
          maxLength: MAX_HEADLINE_LENGTH,
          value: Parameters.string({maxLength: MAX_HEADLINE_LENGTH}),
        },
        ...shared.slice(afterName),
        countOption('comments', 'How many comments, like 1234 or 12.5k (Default: made up)', 'comments'),
        countOption('reposts', 'How many reposts, like 1234 or 12.5k (Default: made up)', 'reposts'),
        {
          name: 'degree',
          description: 'How connected they are, shown after the name (Default: 2nd, 1st has no Follow)',
          ...I18n.optionLocalizations('commands.fun.linkedin.degree'),
          choices: Parameters.Slash.oneOf({
            choices: {'1ST': '1st', '2ND': '2nd', '3RD': '3rd', NONE: 'none'},
            defaultChoice: '2nd',
            doNotSort: true,
            doNotSortDefault: true,
          }),
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
        {
          name: 'time',
          description: 'When it was posted, like "jan 6 2021 9:41am" or "2 hours ago" (Default: made up)',
          ...I18n.optionLocalizations('commands.fun.post.time'),
          // the same option name, its own description: with no time the age is made up, not now
          descriptionLocalizations: I18n.optionLocalizations('commands.fun.linkedin.time').descriptionLocalizations,
          value: Parameters.timestampAny,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunLinkedin.createMessage(context, {
      ...postArgs(args),
      comments: args.comments,
      degree: args.degree,
      headline: args.headline,
      reposts: args.reposts,
      layout: args.layout,
      theme: args.theme,
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

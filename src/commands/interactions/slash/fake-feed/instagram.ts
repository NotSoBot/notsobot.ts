import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions } from '../fake-post/post';


export const COMMAND_NAME = 'instagram';

export interface CommandArgs extends PostCommandArgs {
  comments?: number,
  theme?: RestOptions.MediaICreateInstagram['theme'],
  verified?: boolean,
}

export class InstagramCommand extends BaseInteractionCommandOption {
  description = 'Make an image of an Instagram post (with a picture) or comment (without one) from anyone';
  descriptionLocalizations = I18n.localizations('commands.fun.instagram.description');
  metadata = {
    id: Formatter.Commands.FunInstagram.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.instagram.name');

  constructor() {
    super({
      options: [
        // instagram has no accounts to look up and shows one name, a picture is what makes it a post
        ...postOptions(null, ['handle']),
        countOption('comments', 'How many comments, like 1234 or 12.5k (Default: made up)', 'comments'),
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
        ...postEndOptions(['reply-to']),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunInstagram.createMessage(context, {
      ...postArgs(args),
      comments: args.comments,
      theme: args.theme,
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

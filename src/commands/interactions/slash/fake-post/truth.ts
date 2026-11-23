import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postEndOptions, postOptions, quoteOption } from './post';


export const COMMAND_NAME = 'truth';

export interface CommandArgs extends PostCommandArgs {
  retruths?: number,
  theme?: RestOptions.MediaICreateTruth['theme'],
  verified?: boolean,
}

export class TruthCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Truth Social post from anyone, with your own text and counts';
  descriptionLocalizations = I18n.localizations('commands.fun.truth.description');
  metadata = {
    id: Formatter.Commands.FunTruth.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.truth.name');

  constructor() {
    super({
      options: [
        ...postOptions('truth'),
        countOption('retruths', 'How many ReTruths, like 1234 or 12.5k (Default: made up)', 'retruths'),
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
        quoteOption(),
        ...postEndOptions(),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunTruth.createMessage(context, {
      ...postArgs(args),
      reposts: args.retruths,
      theme: args.theme,
      // the account's own badge shows unless it's said either way
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

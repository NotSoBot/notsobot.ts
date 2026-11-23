import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, countOption, postArgs, postOptions } from '../fake-post/post';


export const COMMAND_NAME = 'tiktok';

export interface CommandArgs extends PostCommandArgs {
  creator?: RestOptions.MediaICreateTikTok['creator'],
  replies?: number,
  sticker?: boolean,
  theme?: RestOptions.MediaICreateTikTok['theme'],
  verified?: boolean,
}

export class TiktokCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a TikTok comment, or the reply sticker creators put on videos, from anyone';
  descriptionLocalizations = I18n.localizations('commands.fun.tiktok.description');
  metadata = {
    id: Formatter.Commands.FunTiktok.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.tiktok.name');

  constructor() {
    super({
      options: [
        // a comment shows the nickname, never the handle
        ...postOptions('tiktok', ['handle']),
        countOption('replies', 'How many replies, like 1234 or 12.5k (Default: made up)', 'replies'),
        {
          name: 'verified',
          description: 'The verified badge after the name',
          ...I18n.optionLocalizations('commands.fun.post.verified'),
          type: Boolean,
        },
        {
          name: 'creator',
          description: 'Mark it as the video creator\'s own comment, or as one the creator liked',
          ...I18n.optionLocalizations('commands.fun.tiktok.creator'),
          choices: Parameters.Slash.oneOf({
            choices: {TAG: 'tag', LIKED: 'liked'},
            descriptions: {liked: 'Liked by creator', tag: 'Creator'},
            doNotSort: true,
          }),
        },
        {
          name: 'sticker',
          description: 'Draw it as the "Reply to comment" sticker from videos, over the image when there is one',
          ...I18n.optionLocalizations('commands.fun.tiktok.sticker'),
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
        {
          // the shared option under its own description: the time is made up here when it's left out
          name: 'time',
          description: 'When it was left, like "jan 6 2021 9:41am" or "2 hours ago" (Default: made up)',
          nameLocalizations: I18n.optionLocalizations('commands.fun.post.time').nameLocalizations,
          descriptionLocalizations: I18n.optionLocalizations('commands.fun.tiktok.time').descriptionLocalizations,
          value: Parameters.timestampAny,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunTiktok.createMessage(context, {
      ...postArgs(args),
      creator: args.creator,
      replies: args.replies,
      sticker: args.sticker,
      theme: args.theme,
      // the account's own badge shows unless it's said either way
      verified: (args.verified === undefined) ? undefined : ((args.verified) ? 'blue' : 'none'),
    });
  }
}

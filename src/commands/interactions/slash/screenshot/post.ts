import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { layoutOption } from '../fake-post/post';


export interface CommandArgs {
  layout?: RestOptions.MediaICreatePostLayout,
  theme?: 'light' | 'dark',
  url: string,
}

export class ScreenshotPostCommand extends BaseInteractionCommandOption {
  description = 'Draw a real post from its link, like a screenshot of it (X, Bluesky, Threads, Mastodon and more)';
  descriptionLocalizations = I18n.localizations('commands.tools.postshot.description');
  metadata = {
    id: Formatter.Commands.ToolsPostshot.COMMAND_ID,
  };
  name = 'post';
  nameLocalizations = I18n.localizations('commands.tools.postshot.name');

  constructor() {
    super({
      options: [
        {
          name: 'url',
          description: 'A link to the post',
          ...I18n.optionLocalizations('commands.tools.postshot.url'),
          maxLength: 2048,
          required: true,
          value: Parameters.string({maxLength: 2048}),
        },
        {
          name: 'theme',
          description: 'The site\'s color theme',
          ...I18n.optionLocalizations('commands.fun.post.theme'),
          // no default named: it's whichever the site's posts are made in
          choices: Parameters.Slash.oneOf({
            choices: {LIGHT: 'light', DARK: 'dark'},
            doNotSort: true,
          }),
        },
        layoutOption(),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ToolsPostshot.createMessage(context, args);
  }
}

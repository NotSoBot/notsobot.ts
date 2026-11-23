import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'postshot';

// mastodon's two looks also go by the version that draws them
const LAYOUT_ALIASES: Record<string, 'old' | 'new'> = {'4': 'old', '4.x': 'old', 'v4': 'old', '5': 'new', '5.0': 'new', 'v5': 'new'};

export interface CommandArgsBefore {
  dark?: boolean,
  layout?: Formatter.Commands.ToolsPostshot.CommandArgs['layout'],
  light?: boolean,
  url?: string,
}

export default class PostshotCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['postscreenshot', 'screenshotpost', 'pshot'],
      args: [
        {name: 'dark', type: Boolean, metadata: {description: 'the site\'s dark theme'}},
        {name: 'layout', type: Parameters.postLayout('old', LAYOUT_ALIASES), metadata: {description: 'which look, on a site that has two: old or new (reddit, facebook, mastodon)'}},
        {name: 'light', type: Boolean, metadata: {description: 'the site\'s light theme'}},
      ],
      label: 'url',
      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Draw a real post from its link, like a screenshot of it. Works with X, Bluesky, Threads, Mastodon, Truth Social, Reddit, Instagram and Facebook',
        examples: [
          `${COMMAND_NAME} https://bsky.app/profile/bsky.app/post/3n2m24be4e223`,
          `${COMMAND_NAME} https://x.com/jack/status/20 -light`,
          `${COMMAND_NAME} https://mastodon.social/@Mastodon/117156549508722805 -layout new`,
        ],
        id: Formatter.Commands.ToolsPostshot.COMMAND_ID,
        usage: '<post link> (-dark) (-light) (-layout <old|new>)',
      },
      type: Parameters.url,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.url;
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.ToolsPostshot.createMessage(context, {
      layout: args.layout,
      // without either it's the theme the site's posts are made in by default
      theme: (args.dark) ? 'dark' : ((args.light) ? 'light' : undefined),
      url: args.url || '',
    });
  }
}

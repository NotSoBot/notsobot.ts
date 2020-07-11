import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export class ScreenshotCommand extends BaseCommand {
  aliases = ['ss'];
  name = 'screenshot';

  label = 'url';
  metadata = {
    description: 'Take a screenshot of a website',
    examples: [
      'hash lolol',
      'hash lolol -use sha256',
    ],
    type: CommandTypes.TOOLS,
    usage: 'screenshot <url>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}

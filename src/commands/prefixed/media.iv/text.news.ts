import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'text news';

export default class TextNewsCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'label', aliases: ['l'], metadata: {description: 'red tab above the headline, default BREAKING NEWS'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Add a TV news lower third (BREAKING NEWS headline and ticker) to an Image or Video',
        examples: [
          `${COMMAND_NAME} Local man finds bug in production`,
          `${COMMAND_NAME} @NotSoBot Bot goes rogue | more at 11 -label LIVE`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayNews.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...headline> ?| <...ticker> (-label <text>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', type: Parameters.parsedMentionsText, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.text) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayNews.CommandArgs) {
    // `text | ticker`, the ticker is optional
    const [ before, ...after ] = (args.text || '').split('|');
    args.text = before.trim();
    if (after.length) {
      args.ticker = after.join('|').trim();
    }
    return Formatter.Commands.MediaIVManipulationOverlayNews.createMessage(context, args);
  }
}

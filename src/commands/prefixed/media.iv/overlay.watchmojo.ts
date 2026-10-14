import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay watchmojo';

export default class OverlayWatchMojoCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o watchmojo', 'watchmojo'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Turn an Image or Video into a WatchMojo video with a title',
        examples: [
          `${COMMAND_NAME} Top 10 Images You Need To See`,
          `${COMMAND_NAME} @NotSoBot Top 10 Discord Bots`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayWatchMojo.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...title>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', type: Parameters.parsedMentionsText, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayWatchMojo.CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayWatchMojo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWatchMojo.createMessage(context, args);
  }
}

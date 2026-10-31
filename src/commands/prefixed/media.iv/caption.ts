import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaMemeFonts, MediaMemeFontsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'caption';

export default class CaptionCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'font', aliases: ['f'], type: Parameters.oneOf({choices: MediaMemeFonts, descriptions: MediaMemeFontsToText})},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Add Caption Text to an Image or Video',
        examples: [
          `${COMMAND_NAME} @NotSoBot what an idiot`,
        ],
        id: Formatter.Commands.MediaIVManipulationCaption.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...text> (-font <choice>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', type: Parameters.parsedMentionsText, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, args);
  }
}

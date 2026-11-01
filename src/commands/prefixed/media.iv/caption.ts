import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'caption';

export default class CaptionCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        // a bundled font or a font file's link, an attached font file works too
        {name: 'font', aliases: ['f'], type: Parameters.mediaFontOrUrl},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Add Caption Text to an Image or Video',
        examples: [
          `${COMMAND_NAME} @NotSoBot what an idiot`,
        ],
        id: Formatter.Commands.MediaIVManipulationCaption.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...text> (-font <choice or font url>)',
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

  async run(context: Command.Context, args: Omit<Formatter.Commands.MediaIVManipulationCaption.CommandArgs, 'font'> & {font?: Parameters.MediaFontArgs}) {
    const fontUrl = args.font?.fontUrl || await Parameters.fontFileUrl(context);
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, {...args, font: args.font?.font, fontUrl});
  }
}

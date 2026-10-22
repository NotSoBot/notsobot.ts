import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'text youtube';

export default class TextYouTubeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['text yt'],
      args: [
        {name: 'channel', aliases: ['c'], metadata: {description: 'channel name, default your name'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Turn an Image or Video into a YouTube video with a title',
        examples: [
          `${COMMAND_NAME} Kid Discovers Painting (GONE WRONG)`,
          `${COMMAND_NAME} @NotSoBot I tried it for 24 hours -channel MrBeast`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayYouTube.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...title> (-channel <text>)',
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

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayYouTube.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayYouTube.createMessage(context, args);
  }
}

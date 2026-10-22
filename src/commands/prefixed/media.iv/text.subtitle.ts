import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'text subtitle';

export default class TextSubtitleCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['text subtitles', 'text subs'],
      args: [
        {name: 'yellow', aliases: ['y'], type: Boolean, metadata: {description: 'yellow dvd style subtitles'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Add movie subtitles to the bottom of an Image or Video',
        examples: [
          `${COMMAND_NAME} I'll be back.`,
          `${COMMAND_NAME} @NotSoBot [ominous music playing] -yellow`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlaySubtitle.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...text> (-yellow)',
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

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlaySubtitle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlaySubtitle.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'meme';

export default class MemeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Add Meme Text to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @NotSoBot what an idiot`,
          `${COMMAND_NAME} @NotSoBot what an idiot | lmao`,
        ],
        id: Formatter.Commands.MediaIVManipulationMeme.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...text>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', consume: true},
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

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMeme.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMeme.createMessage(context, args);
  }
}

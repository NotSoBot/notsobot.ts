import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'text snapchat';

export default class TextSnapchatCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['text snap'],
      args: [
        {name: 'position', aliases: ['p'], type: 'float', metadata: {description: '0 (top) to 100 (bottom), default 50'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Add a Snapchat caption (text on a see-through black bar) to an Image or Video',
        examples: [
          `${COMMAND_NAME} when the code finally works`,
          `${COMMAND_NAME} @NotSoBot me at 3am -position 75`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlaySnapchat.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...text> (-position <float>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', type: Parameters.parsedMentionsText, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlaySnapchat.CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlaySnapchat.CommandArgs) {
    if (!args.text) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlaySnapchat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlaySnapchat.createMessage(context, args);
  }
}

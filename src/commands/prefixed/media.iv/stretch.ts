import { Command, CommandClient } from 'detritus-client';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'stretch';

export default class StretchCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'crop', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Stretch an Image or Video by its Width or Height',
        examples: [
          `${COMMAND_NAME} notsobot 1 3`,
          `${COMMAND_NAME} notsobot 2 3`,
        ],
        id: Formatter.Commands.MediaIVManipulationStretch.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <width,number> <height,number> (-crop)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'width', type: 'float'},
        {name: 'height', type: 'float'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationStretch.CommandArgs) {
    return (!!args.width || !!args.height) && (args.width !== args.height) && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationStretch.CommandArgs) {
    if (!args.width && !args.height) {
      return super.onCancelRun(context, args);
    }
    if (args.width === args.height) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Width and Height amount cannot be the same.`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationStretch.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationStretch.createMessage(context, args);
  }
}

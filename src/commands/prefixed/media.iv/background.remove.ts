import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ImageBackgroundRemovalModels } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'background remove';

export default class BackgroundRemoveCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['background rm', 'bg remove', 'bg rm'],
      args: [
        {name: 'model', aliases: ['m', 'use'], type: Parameters.oneOf({choices: ImageBackgroundRemovalModels})},
        {name: 'trim', aliases: ['t'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Remove the background of an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -model U2NETP`,
          `${COMMAND_NAME} notsobot -trim`,
        ],
        id: Formatter.Commands.MediaIVToolsBackgroundRemove.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-model <ImageBackgroundRemovalModels>) (-trim)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsBackgroundRemove.CommandArgs) {
    return Formatter.Commands.MediaIVToolsBackgroundRemove.createMessage(context, args);
  }
}

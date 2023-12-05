import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ImageObjectRemovalLabels } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'object remove';

export default class ObjectRemoveCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['object rm', 'obj remove', 'obj rm'],
      args: [
        {name: 'object', choices: Object.values(ImageObjectRemovalLabels), help: `Must be one of: (${Object.values(ImageObjectRemovalLabels).join(', ')})`},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Remove the background of an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -object person`,
        ],
        id: Formatter.Commands.MediaIVToolsObjectRemove.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-model <ImageObjectRemovalLabelsToText>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsObjectRemove.CommandArgs) {
    return Formatter.Commands.MediaIVToolsObjectRemove.createMessage(context, args);
  }
}

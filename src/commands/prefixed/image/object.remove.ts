import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ImageObjectRemovalLabels } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  model?: string,
  url?: null | string,
}

export const COMMAND_NAME = 'object remove';

export default class ObjectRemoveCommand extends BaseImageCommand<Formatter.Commands.ImageObjectRemove.CommandArgs> {
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
        id: Formatter.Commands.ImageObjectRemove.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-model <ImageObjectRemovalLabelsToText>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageObjectRemove.CommandArgs) {
    return Formatter.Commands.ImageObjectRemove.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  upload: boolean,
  url?: null | string,
}

export interface CommandArgs {
  upload: boolean,
  url: string,
}

export const COMMAND_NAME = 'ocr';

export default class OCRCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        //{name: 'files.gg', label: 'upload', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.AI,
        description: 'Read text inside of an image (Optical Character Recognition)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/captioned.png`,
        ],
        id: Formatter.Commands.ToolsOCR.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
      type: Parameters.lastMediaUrl({audio: false, video: false}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsOCR.createMessage(context, args);
  }
}

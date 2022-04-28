import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR } from '../../../api';
import { CommandCategories, EmbedBrands, EmbedColors } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, createUserEmbed, editOrReply, languageCodeToText } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  noembed: boolean,
  upload: boolean,
  url?: null | string,
}

export interface CommandArgs {
  noembed: boolean,
  upload: boolean,
  url: string,
}

export const COMMAND_NAME = 'ocr';

export default class OCRCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'noembed', default: DefaultParameters.noEmbed, type: () => true},
        {name: 'files.gg', label: 'upload', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Read text inside of an image (Optical Character Recognition)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png`,
        ],
        id: Formatter.Commands.ToolsOCR.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-noembed) (-files.gg)',
      },
      type: Parameters.lastImageUrl,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsOCR.createMessage(context, args);
  }
}

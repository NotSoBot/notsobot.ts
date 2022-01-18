import { Command, CommandClient } from 'detritus-client';

import { CommandTypes, GoogleLocales } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  to: null | GoogleLocales,
  url?: null | string,
}

export interface CommandArgs {
  to: null | GoogleLocales,
  url: string,
}

export const COMMAND_NAME = 'ocrtranslate';

export default class OCRTranslateCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ocrtr', 'trocr', 'translateocr'],
      args: [
        {name: 'to', default: DefaultParameters.locale, type: Parameters.locale},
      ],
      metadata: {
        description: 'Read text inside of an image and translate it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png`,
          `${COMMAND_NAME} https://google.com -to russian`,
        ],
        type: CommandTypes.TOOLS,
        usage: '?<emoji,user:id|mention|name,url> (-to <language>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsOCRTranslate.createMessage(context, {
      to: args.to,
      url: args.url,
    });
  }
}

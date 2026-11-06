import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, CommandRatelimits, GoogleLocales } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  replace: boolean,
  to: null | GoogleLocales,
  url?: null | string,
}

export interface CommandArgs {
  replace: boolean,
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
        {name: 'replace', type: Boolean, metadata: {description: 'Replace the text in the image with its translation'}},
        {name: 'to', default: DefaultParameters.locale, type: Parameters.locale},
      ],
      metadata: {
        category: CommandCategories.AI,
        description: 'Read text inside of an Image and translate it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/captioned.png -to russian`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/captioned.png -to spanish -replace`,
        ],
        id: Formatter.Commands.ToolsOCRTranslate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-replace) (-to <language>)',
      },
      ratelimits: CommandRatelimits.ML,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsOCRTranslate.createMessage(context, {
      replace: args.replace,
      to: args.to,
      url: args.url,
    });
  }
}

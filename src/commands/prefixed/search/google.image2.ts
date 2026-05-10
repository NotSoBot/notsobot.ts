import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GoogleLocales } from '../../../constants';
import { Formatter, Parameters, DefaultParameters } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'google image2';

export default class Image2Command extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['g image2', 'g img2', 'g im2', 'google img2', 'google im2'],
      args: [
        {name: 'locale', aliases: ['language'], default: DefaultParameters.locale, type: Parameters.locale},
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Google Images, but with less data displayed',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -locale russian`,
          `${COMMAND_NAME} something nsfw -safe`,
          `${COMMAND_NAME} notsobot -randomize`,
          `${COMMAND_NAME} notsobot -r`,
        ],
        id: Formatter.Commands.SearchGoogleImages.COMMAND_ID_SIMPLE,
        usage: '<query> (-locale <language>) (-randomize) (-safe)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchGoogleImages.CommandArgs) {
    return Formatter.Commands.SearchGoogleImages.createMessage(context, {
      ...args,
      simple: true,
    });
  }
}

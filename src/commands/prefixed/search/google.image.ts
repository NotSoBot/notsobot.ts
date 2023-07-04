import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GoogleLocales } from '../../../constants';
import { Formatter, Parameters, DefaultParameters } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'image';

export default class ImageCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['g image', 'g img', 'g im', 'google image', 'google img', 'google im', 'img', 'im'],
      args: [
        {name: 'locale', aliases: ['language'], default: DefaultParameters.locale, type: Parameters.locale},
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Google Images',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -locale russian`,
          `${COMMAND_NAME} something nsfw -safe`,
          `${COMMAND_NAME} notsobot -randomize`,
          `${COMMAND_NAME} notsobot -r`,
        ],
        id: Formatter.Commands.SearchGoogleImages.COMMAND_ID,
        usage: '<query> (-locale <language>) (-randomize) (-safe)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchGoogleImages.CommandArgs) {
    return Formatter.Commands.SearchGoogleImages.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandTypes, GoogleLocales } from '../../../constants';
import { Arguments, Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  locale: GoogleLocales,
  query: string,
  randomize: boolean,
  safe: boolean,
}

export const COMMAND_NAME = 'image';

export default class ImageCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['g image', 'g img', 'g im', 'google image', 'google img', 'google im', 'img', 'im'],
      args: [
        Arguments.GoogleLocale,
        Arguments.Safe,
        {aliases: ['r', 'random'], name: 'randomize', type: Boolean},
      ],
      metadata: {
        description: 'Search Google Images',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -locale russian`,
          `${COMMAND_NAME} something nsfw -safe`,
          `${COMMAND_NAME} notsobot -randomize`,
          `${COMMAND_NAME} notsobot -r`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query> (-locale <language>) (-randomize) (-safe)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.SearchGoogleImages.createMessage(context, args);
  }
}

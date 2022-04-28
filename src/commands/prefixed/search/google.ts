import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GoogleLocales } from '../../../constants';
import { Formatter, Parameters, DefaultParameters } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  locale: GoogleLocales,
  query: string,
  safe: boolean,
}

export const COMMAND_NAME = 'google';

export default class GoogleCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['g', 'google search', 'g search'],
      args: [
        {name: 'locale', aliases: ['language'], default: DefaultParameters.locale, type: Parameters.locale},
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Google',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -locale russian`,
          `${COMMAND_NAME} something nsfw -safe`,
        ],
        id: Formatter.Commands.SearchGoogleWeb.COMMAND_ID,
        usage: '<query> (-locale <language>) (-safe)',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.SearchGoogleWeb.createMessage(context, args);
  }
}

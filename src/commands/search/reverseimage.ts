import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { Arguments, Paginator } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  locale: string,
  query: string,
  safe: boolean,
}

// use Parameters.lastImageUrl

export default class ReverseSearchCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['images', 'imgs'];
  name = 'reversesearch';

  metadata = {
    description: 'Reverse Search an image using Google',
    examples: [
      'reversesearch',
      'reversesearch notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'reversesearch ?<emoji|id|mention|name|url> (-locale <language>) (-safe)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [Arguments.GoogleLocale, Arguments.Safe],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return context.editOrReply('yeet');
  }
}

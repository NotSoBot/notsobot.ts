import { Command } from 'detritus-client';

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

  args = [
    Arguments.GoogleLocale,
    Arguments.Safe,
  ];
  metadata = {
    description: 'Reverse Search an image using Google',
    examples: [
      'reversesearch',
      'reversesearch notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'reversesearch ?<emoji,user:id|mention|name,url> (-locale <language>) (-safe)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    return context.editOrReply('yeet');
  }
}

import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  url: string,
}

export interface CommandArgs {
  url: string,
}

export default class GlitchCommand extends BaseCommand {
  name = 'glitch';

  args = [
    {name: 'amount', type: Number},
    {name: 'iterations', type: Number},
    {name: 'seed', type: Number},
    {name: 'type'},
  ];
  label = 'url';
  metadata = {
    description: 'Glitch an Image',
    examples: [
      'glitch',
      'glitch cake',
      'glitch cake -type 2',
    ],
    type: CommandTypes.IMAGE,
    usage: 'glitch ?<emoji|id|mention|name|url> (-amount <number>) (-iterations <number>) (-seed <number>) (-type <glitch-type>)',
  };

  run(context: Command.Context, args: CommandArgs) {

  }
}

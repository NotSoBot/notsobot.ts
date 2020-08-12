import { Command } from 'detritus-client';

import { imageLegofy } from '../../api';
import { CommandTypes, ImageLegofyPalettes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  dither: boolean,
  palette?: ImageLegofyPalettes,
  url?: null | string,
}

export interface CommandArgs {
  dither: boolean,
  palette?: ImageLegofyPalettes,
  url: string,
}

export default class LegofyCommand extends BaseImageCommand<CommandArgs> {
  aliases = ['lego'];
  name = 'legofy';

  args = [
    {name: 'dither', type: Boolean},
    {name: 'palette', choices: Object.values(ImageLegofyPalettes), help: `Must be one of: (${Object.values(ImageLegofyPalettes).join(', ')})`},
  ];
  metadata = {
    description: 'Legofy an image',
    examples: [
      'legofy',
      'legofy notsobot',
      'legofy notsobot -palette mono',
      'legofy notsobot -dither',
    ],
    type: CommandTypes.IMAGE,
    usage: 'legofy ?<emoji|id|mention|name|url> (-dither) (-palette <ImageLegofyPalettes>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageLegofy(context, args);
    return imageReply(context, response);
  }
}

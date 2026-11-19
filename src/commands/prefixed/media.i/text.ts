import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaTextAlignments, MediaTextAlignmentsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'text';

export default class TextCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tti'],

      args: [
        {name: 'align', aliases: ['a'], type: Parameters.oneOf({choices: MediaTextAlignments, descriptions: MediaTextAlignmentsToText}), metadata: {description: 'how the lines line up (default: center)'}},
        {name: 'background', aliases: ['bg'], metadata: {description: 'a box behind the text in this color'}},
        {name: 'color', aliases: ['c'], metadata: {description: 'text color, a name, #hex or r,g,b(,a)'}},
        {name: 'font', aliases: ['f'], metadata: {description: 'a bundled font (impact, arial, roboto...) or one of your saved fonts'}},
        {name: 'markup', type: Boolean, metadata: {description: 'read pango markup like <b>bold</b> in the text'}},
        {name: 'shadow', aliases: ['sh'], metadata: {description: 'a drop shadow in this color'}},
        {name: 'size', aliases: ['s'], type: 'float', metadata: {description: '1 to 500 pixels (default: 48)'}},
        {name: 'stroke', aliases: ['outline'], metadata: {description: 'an outline in this color'}},
        {name: 'strokewidth', aliases: ['sw'], type: 'float', metadata: {description: '0 to 100 pixels (default: a 16th of the size)'}},
        {name: 'width', aliases: ['w'], type: Number, metadata: {description: 'wrap lines past this many pixels'}},
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make a transparent image of some text, in any font, color, outline and shadow',
        examples: [
          `${COMMAND_NAME} hello there`,
          `${COMMAND_NAME} big news -font impact -size 120 -color white -stroke black`,
          `${COMMAND_NAME} soft glow -font pricedown -color #ffcc00 -shadow black`,
        ],
        id: Formatter.Commands.MediaICreateText.COMMAND_ID,
        usage: '<...text> (-align <MediaTextAlignments>) (-background <color>) (-color <color>) (-font <name>) (-markup) (-shadow <color>) (-size <float>) (-stroke <color>) (-strokewidth <float>) (-width <number>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateText.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateText.CommandArgs) {
    return Formatter.Commands.MediaICreateText.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaTextAlignments, MediaTextAlignmentsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'drawtext';

export default class DrawTextCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['draw text'],

      args: [
        {name: 'align', aliases: ['a'], type: Parameters.oneOf({choices: MediaTextAlignments, descriptions: MediaTextAlignmentsToText}), metadata: {description: 'how the lines line up (default: center)'}},
        {name: 'background', aliases: ['bg'], metadata: {description: 'a box behind the text in this color'}},
        {name: 'color', aliases: ['c'], metadata: {description: 'text color, a name, #hex or r,g,b(,a)'}},
        {name: 'end', aliases: ['e'], type: 'float', metadata: {description: 'seconds of a video it stops showing at'}},
        {name: 'font', aliases: ['f'], metadata: {description: 'a bundled font (impact, arial, roboto...) or one of your saved fonts'}},
        {name: 'markup', type: Boolean, metadata: {description: 'read pango markup like <b>bold</b> in the text'}},
        {name: 'shadow', aliases: ['sh'], metadata: {description: 'a drop shadow in this color'}},
        {name: 'size', aliases: ['s'], type: 'float', metadata: {description: '1 to 500 pixels (default: 48)'}},
        {name: 'start', type: 'float', metadata: {description: 'seconds of a video it starts showing at'}},
        {name: 'stroke', aliases: ['outline'], metadata: {description: 'an outline in this color'}},
        {name: 'strokewidth', aliases: ['sw'], type: 'float', metadata: {description: '0 to 100 pixels (default: a 16th of the size)'}},
        {name: 'width', aliases: ['w'], type: Number, metadata: {description: 'wrap lines past this many pixels'}},
        {name: 'x', metadata: {description: 'where it goes across, maths with w h tw th t (default: centered)'}},
        {name: 'y', metadata: {description: 'where it goes down, maths with w h tw th t (default: centered)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write text onto an Image or Video, white with a black outline unless you pick its look',
        examples: [
          `${COMMAND_NAME} hello there`,
          `${COMMAND_NAME} bottom text -y h-th-20 -size 64`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 subscribe -x w-tw-20 -y 20 -start 1 -end 4 -color red`,
        ],
        id: Formatter.Commands.MediaIVManipulationTextDraw.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <...text> (-end <seconds>) (-start <seconds>) (-x <maths>) (-y <maths>) (-align <MediaTextAlignments>) (-background <color>) (-color <color>) (-font <name>) (-markup) (-shadow <color>) (-size <float>) (-stroke <color>) (-strokewidth <float>) (-width <number>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationTextDraw.CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationTextDraw.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTextDraw.createMessage(context, args);
  }
}

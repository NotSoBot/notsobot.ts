import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'vegaswave';

export default class VegasWaveCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['xs'], label: 'xSpeed', name: 'xspeed', type: 'float', metadata: {description: 'radians a second, -100 to 100'}},
        {aliases: ['xf'], label: 'xFrequency', name: 'xfrequency', type: 'float', metadata: {description: 'half waves down it, -100 to 100'}},
        {aliases: ['xi'], label: 'xIntensity', name: 'xintensity', type: 'float', metadata: {description: 'of the width, -1 to 1'}},
        {aliases: ['xp'], label: 'xPhase', name: 'xphase', type: 'float', metadata: {description: 'radians'}},
        {aliases: ['ys'], label: 'ySpeed', name: 'yspeed', type: 'float', metadata: {description: 'radians a second, -100 to 100'}},
        {aliases: ['yf'], label: 'yFrequency', name: 'yfrequency', type: 'float', metadata: {description: 'half waves across it, -100 to 100'}},
        {aliases: ['yi'], label: 'yIntensity', name: 'yintensity', type: 'float', metadata: {description: 'of the height, -1 to 1'}},
        {aliases: ['yp'], label: 'yPhase', name: 'yphase', type: 'float', metadata: {description: 'radians'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Bend an Image or Video along waves across and down, like VEGAS\' Wave (x moves it sideways, y up and down, and a speed moves the waves)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot -xspeed 6.28`,
          `${COMMAND_NAME} notsobot -xfrequency 8 -xintensity 0.03 -yintensity 0`,
        ],
        id: Formatter.Commands.MediaIVManipulationWaveVegas.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-xspeed <float>) (-xfrequency <float>) (-xintensity <float>) (-xphase <float>) (-yspeed <float>) (-yfrequency <float>) (-yintensity <float>) (-yphase <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWaveVegas.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWaveVegas.createMessage(context, args);
  }
}

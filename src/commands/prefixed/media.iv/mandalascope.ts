import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'mandalascope';

export default class MandalaScopeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amount', type: Number, metadata: {description: '3 to 16'}},
        {aliases: ['r'], name: 'rotation', type: Number, metadata: {description: '0 to 360'}},
        {aliases: ['s'], name: 'scale', type: 'float', metadata: {description: '0.01 to 10'}},
        {aliases: ['t'], name: 'translation', type: Number, metadata: {description: '0 to 200'}},
        {aliases: ['z'], name: 'zoom', type: 'float', metadata: {description: '0.01 to 10'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Apply a Mandala-like Kaleidoscope filter to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -amount 4`,
        ],
        id: Formatter.Commands.MediaIVManipulationMandalaScope.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-rotation <number>) (-scale <float>) (-translation <number>) (-zoom <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMandalaScope.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMandalaScope.createMessage(context, args);
  }
}

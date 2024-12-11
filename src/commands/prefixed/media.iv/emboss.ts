import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaEmbossComposeMethods, MediaEmbossMethods } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'emboss';

export default class EmbossCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'azimuth', type: Number},
        {aliases: ['c'], name: 'compose', type: Parameters.oneOf({choices: MediaEmbossComposeMethods})},
        {aliases: ['e'], name: 'elevation', type: Number},
        {aliases: ['d'], name: 'depth', type: Number},
        {aliases: ['i'], name: 'intensity', type: Number},
        {aliases: ['g'], name: 'gray', type: 'float'},
        {aliases: ['m'], name: 'method', type: Parameters.oneOf({choices: MediaEmbossMethods})},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply an Emboss effect to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationEmboss.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-azimuth <number>) (-compose <MediaEmbossComposeMethods>) (-elevation <number>) (-depth <number>) (-intensity <number>) (-gray <float>) (-method <MediaEmbossMethods>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEmboss.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEmboss.createMessage(context, args);
  }
}

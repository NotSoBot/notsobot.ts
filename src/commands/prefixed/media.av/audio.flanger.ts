import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio flanger';

export default class AudioFlangerCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a flanger'],
      args: [
        {name: 'delay', aliases: ['d'], type: Number, metadata: {description: '0 to 30'}},
        {name: 'depth', aliases: ['dp'], type: Number, metadata: {description: '0 to 10'}},
        {name: 'phase', aliases: ['p'], type: Number, metadata: {description: '0 to 100'}},
        {name: 'regen', aliases: ['r'], type: Number, metadata: {description: '-95 to 95'}},
        {name: 'speed', aliases: ['s'], type: 'float', metadata: {description: '0.1 to 10'}},
        {name: 'width', aliases: ['w'], type: Number, metadata: {description: '0 to 100'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Apply a Flanger Effect on an Audio or Video',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioFlanger.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-delay <number>) (-depth <number>) (-phase <number>) (-regen <number>) (-speed <float>) (-width <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioFlanger.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioFlanger.createMessage(context, args);
  }
}

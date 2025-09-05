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
        {name: 'delay', aliases: ['d'], type: Number},
        {name: 'depth', aliases: ['dp'], type: Number},
        {name: 'phase', aliases: ['p'], type: Number},
        {name: 'regen', aliases: ['r'], type: Number},
        {name: 'speed', aliases: ['s'], type: 'float'},
        {name: 'width', aliases: ['w'], type: Number},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
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

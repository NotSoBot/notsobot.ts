import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaSongSounds, MediaSongSoundsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'song';

export default class SongCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'bars', aliases: ['b'], type: Number, metadata: {description: 'how many bars, one chord a bar (default: the chords twice, at most 60 seconds)'}},
        {name: 'bpm', type: Number, metadata: {description: '40 to 240 (default: 120)'}},
        {name: 'nodrums', aliases: ['nd'], type: Boolean, metadata: {description: 'leave the drums out'}},
        {name: 'sound', aliases: ['s'], type: Parameters.oneOf({choices: MediaSongSounds, descriptions: MediaSongSoundsToText}), metadata: {description: 'what the chords are played on (default: Pluck)'}},
      ],
      label: 'chords',
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Make a song out of chords, with a bass and drums',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} Am F C G -bpm 90`,
          `${COMMAND_NAME} F#m7 Dmaj7 A E -sound pad -nodrums`,
          `${COMMAND_NAME} C G Am F -sound chiptune -bars 16`,
        ],
        id: Formatter.Commands.MediaACreateSong.COMMAND_ID,
        usage: '?<...chords> (-bars <number>) (-bpm <number>) (-nodrums) (-sound <MediaSongSounds>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaACreateSong.CommandArgs) {
    return Formatter.Commands.MediaACreateSong.createMessage(context, args);
  }
}

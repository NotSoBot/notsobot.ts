import { Interaction } from 'detritus-client';

import { MediaSongSounds, MediaSongSoundsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'song';

export class MediaAVSongCommand extends BaseInteractionCommandOption {
  description = 'Make a song out of chords, with a bass and drums';
  descriptionLocalizations = I18n.localizations('commands.media_av.song.description');
  metadata = {
    id: Formatter.Commands.MediaACreateSong.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.song.name');

  constructor() {
    super({
      options: [
        {
          name: 'chords',
          description: 'Chords like C Am F G or F#m7 Bbsus4, one a bar (Default: C Am F G)',
          ...I18n.optionLocalizations('commands.media_av.song.chords'),
          maxLength: 512,
          value: Parameters.string({maxLength: 512}),
        },
        {name: 'bpm', description: 'Beats per minute, 40 to 240 (Default: 120)', ...I18n.optionLocalizations('commands.media_av.song.bpm'), type: Number},
        {name: 'bars', description: 'How many bars to play (Default: the chords twice, at most 60 seconds)', ...I18n.optionLocalizations('commands.media_av.song.bars'), type: Number},
        {
          name: 'sound',
          description: `What the chords are played on (Default: ${MediaSongSoundsToText[MediaSongSounds.PLUCK]})`,
          ...I18n.optionLocalizations('commands.media_av.song.sound'),
          choices: Parameters.Slash.oneOf({
            choices: MediaSongSounds,
            descriptions: MediaSongSoundsToText,
            defaultChoice: MediaSongSounds.PLUCK,
            localizationKey: 'choices.media_song_sounds',
          }),
        },
        {name: 'drums', description: 'Play the drums (Default: True)', ...I18n.optionLocalizations('commands.media_av.song.drums'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaACreateSong.CommandArgs) {
    return Formatter.Commands.MediaACreateSong.createMessage(context, args);
  }
}

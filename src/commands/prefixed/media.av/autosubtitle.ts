import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'autosubtitle';

export default class AutoSubtitleCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autosubtitles', 'autosub', 'autosubs'],
      args: [
        // a bundled font or a font file's link, an attached font file works too
        {name: 'font', aliases: ['f'], type: Parameters.mediaFontOrUrl},
        {name: 'highlight', aliases: ['h'], type: Boolean, metadata: {description: 'highlight the word being said'}},
        {name: 'yellow', aliases: ['y'], type: Boolean, metadata: {description: 'dvd yellow text instead of white'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Add subtitles of what\'s said in an Audio or Video, an Audio gets a black video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -highlight -font impact`,
        ],
        id: Formatter.Commands.MediaAVToolsAutoSubtitle.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-font <choice or font url>) (-highlight) (-yellow)',
      },
    });
  }

  async run(context: Command.Context, args: Omit<Formatter.Commands.MediaAVToolsAutoSubtitle.CommandArgs, 'font'> & {font?: Parameters.MediaFontArgs}) {
    const fontUrl = args.font?.fontUrl || await Parameters.fontFileUrl(context);
    return Formatter.Commands.MediaAVToolsAutoSubtitle.createMessage(context, {...args, font: args.font?.font, fontUrl});
  }
}

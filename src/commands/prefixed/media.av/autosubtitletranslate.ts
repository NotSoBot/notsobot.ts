import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'autosubtitletranslate';

export default class AutoSubtitleTranslateCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autosubtitletr', 'autosubtr', 'autosubtranslate', 'autosubtitlestranslate'],
      args: [
        // a bundled font or a font file's link, an attached font file works too
        {name: 'font', aliases: ['f'], type: Parameters.mediaFontOrUrl},
        {name: 'highlight', aliases: ['h'], type: Boolean, metadata: {description: 'highlight the word being said, only when it\'s already in that language'}},
        {name: 'to', aliases: ['t'], default: DefaultParameters.locale, type: Parameters.locale},
        {name: 'yellow', aliases: ['y'], type: Boolean, metadata: {description: 'dvd yellow text instead of white'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Add subtitles of what\'s said in an Audio or Video translated to your language, an Audio gets a black video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -to spanish -font impact`,
        ],
        id: Formatter.Commands.MediaAVToolsAutoSubtitleTranslate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-font <choice or font url>) (-highlight) (-to <language>) (-yellow)',
      },
    });
  }

  async run(context: Command.Context, args: Omit<Formatter.Commands.MediaAVToolsAutoSubtitleTranslate.CommandArgs, 'font'> & {font?: Parameters.MediaFontArgs}) {
    const fontUrl = args.font?.fontUrl || await Parameters.fontFileUrl(context);
    return Formatter.Commands.MediaAVToolsAutoSubtitleTranslate.createMessage(context, {...args, font: args.font?.font, fontUrl});
  }
}

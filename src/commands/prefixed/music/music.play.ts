import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures } from '../../../constants';
import { DefaultParameters, Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music play';

export default class MusicPlayCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      // nothing given plays the last audio/video (an attachment, a reply's)
      default: DefaultParameters.lastMediaUrl({image: false}),
      label: 'query',
      metadata: {
        description: 'Search for a song to pick from (or play a spotify/deezer/tidal/apple music/youtube music track link, or a link to a file) in your voice channel',
        examples: [
          `${COMMAND_NAME} lorde david`,
          `${COMMAND_NAME} https://open.spotify.com/track/6ghDayhHeBXAP4OOnnrFW9`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicPlay.COMMAND_ID,
        usage: '?<query or url>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MusicPlay.CommandArgs) {
    return !!args.query;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.MusicPlay.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('music_play.no_results')});
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicPlay.CommandArgs) {
    return Formatter.Commands.MusicPlay.createMessage(context, args);
  }
}

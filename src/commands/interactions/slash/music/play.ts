import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';


import { DefaultParameters, Formatter, I18n, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  attachment?: Structures.Attachment,
  query?: null | string,
}

export class MusicPlayCommand extends BaseInteractionCommandOption {
  description = 'Search for a song to pick from, or play a track link or a file';
  metadata = {
    id: Formatter.Commands.MusicPlay.COMMAND_ID,
  };
  name = 'play';

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'A song to search for, a spotify/deezer/tidal/apple music track link, or a link to a file',
          // nothing given plays the attachment, or the last audio/video in the channel
          default: DefaultParameters.lastMediaUrl({image: false}),
        },
        {name: 'attachment', description: 'Audio/Video File', type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!((args.attachment && args.attachment.url) || args.query);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('music_play.no_results')});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const query = (args.attachment && args.attachment.url) || args.query!;
    return Formatter.Commands.MusicPlay.createMessage(context, {query});
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'wlmp';

// the label is `payload` instead of the media command's `url`, both are here so the hooks below can override its own
export interface CommandArgsBefore {
  payload?: Parameters.FilePayload,
  url?: null | string,
}

export default class WlmpCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['moviemaker', 'wlmprender', 'wlmp render'],
      label: 'payload',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Play a Movie Maker project (.wlmp) with every one of its sources replaced by an Audio/Image/Video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/movie.wlmp https://cdn.nsb.gg/assets/samples/video.mp4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/movie.wlmp @cakedan`,
        ],
        id: Formatter.Commands.MediaAIVManipulationWlmp.COMMAND_ID,
        usage: '<.wlmp url or attachment> ?<emoji,user:id|mention|name,url>',
      },
      type: Parameters.filePayload('.wlmp'),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: wlmp, url } = args.payload || {};
    if (url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: url});
    }
    return !!url && !!wlmp;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: wlmp, url } = args.payload || {};
    if (!wlmp) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_wlmp_found'));
    }
    return super.onCancelRun(context, {url});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const { file: wlmp, url } = args.payload!;
    return Formatter.Commands.MediaAIVManipulationWlmp.createMessage(context, {
      url: url!,
      wlmp: wlmp!,
    });
  }
}

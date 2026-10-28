import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'xyt';

// the label is `payload` instead of the media command's `url`, both are here so the hooks below can override its own
export interface CommandArgsBefore {
  payload?: Parameters.FilePayload,
  url?: null | string,
}

export default class XytCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['vivavideo'],
      label: 'payload',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Apply a VivaVideo filter or fx template (.xyt) to an Image or Video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/funface.xyt notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationXyt.COMMAND_ID,
        usage: '<.xyt url or attachment> ?<emoji,user:id|mention|name,url>',
      },
      type: Parameters.filePayload('.xyt', {audio: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: xyt, url } = args.payload || {};
    if (url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: url});
    }
    return !!url && !!xyt;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: xyt, url } = args.payload || {};
    if (!xyt) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_xyt_found'));
    }
    return super.onCancelRun(context, {url});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const { file: xyt, url } = args.payload!;
    return Formatter.Commands.MediaIVManipulationXyt.createMessage(context, {
      url: url!,
      xyt: xyt!,
    });
  }
}

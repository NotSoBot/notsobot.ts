import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'kine';

// the label is `payload` instead of the media command's `url`, both are here so the hooks below can override its own
export interface CommandArgsBefore {
  payload?: Parameters.FilePayload,
  url?: null | string,
}

export default class KineCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['kinemaster', 'kinerender', 'kine render'],
      label: 'payload',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Play a KineMaster project (.kine) with all of its media replaced by an Audio/Image/Video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/preview2.kine https://cdn.nsb.gg/assets/samples/video.mp4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/preview2.kine @cakedan`,
        ],
        id: Formatter.Commands.MediaAIVManipulationKine.COMMAND_ID,
        usage: '<.kine url or attachment> ?<emoji,user:id|mention|name,url>',
      },
      type: Parameters.filePayload('.kine'),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: kine, url } = args.payload || {};
    if (url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: url});
    }
    return !!url && !!kine;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: kine, url } = args.payload || {};
    if (!kine) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_kine_found'));
    }
    return super.onCancelRun(context, {url});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const { file: kine, url } = args.payload!;
    return Formatter.Commands.MediaAIVManipulationKine.createMessage(context, {
      kine: kine!,
      url: url!,
    });
  }
}

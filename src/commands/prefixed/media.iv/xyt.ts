import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'xyt';

// the label is `payload` instead of the media command's `url`, both are here so the hooks below can override its own
export interface CommandArgsBefore {
  payload?: Parameters.FilePayload,
  text?: string,
  url?: null | string,
}

export default class XytCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['vivavideo'],
      args: [
        // a text bubble template's words
        {name: 'text', aliases: ['t'], type: Parameters.parsedMentionsText},
      ],
      label: 'payload',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Apply a VivaVideo filter or fx template (.xyt) to an Image or Video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/funface.xyt notsobot`,
          `${COMMAND_NAME} 0x060000000000000A notsobot`,
          `${COMMAND_NAME} rose notsobot`,
          `${COMMAND_NAME} 0x0900000000000154 notsobot -text hello world`,
        ],
        id: Formatter.Commands.MediaIVManipulationXyt.COMMAND_ID,
        usage: '<.xyt url or attachment,template id or name> ?<emoji,user:id|mention|name,url> ?<-text words>',
      },
      // a leading word that isn't a url or media is a built-in template's id or name
      type: Parameters.filePayload('.xyt', {audio: false}, {names: true}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: xyt, name: xytId, url } = args.payload || {};
    if (url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: url});
    }
    return !!url && !!(xyt || xytId);
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: xyt, name: xytId, url } = args.payload || {};
    if (!xyt && !xytId) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_xyt_found'));
    }
    return super.onCancelRun(context, {url});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const { file: xyt, name: xytId, url } = args.payload!;
    return Formatter.Commands.MediaIVManipulationXyt.createMessage(context, {
      text: args.text || undefined,
      url: url!,
      ...((xyt) ? {xyt} : {xytId: xytId!}),
    });
  }
}

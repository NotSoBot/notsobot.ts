import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'vep';

// the label is `payload` instead of the media command's `url`, both are here so the hooks below can override its own
export interface CommandArgsBefore {
  payload?: Parameters.FilePayload,
  url?: null | string,
}

export default class VepCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['avs', 'avsvideoeditor', 'veprender', 'vep render'],
      label: 'payload',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Play an AVS Video Editor project (.vep) with all of its sources replaced by an Audio/Image/Video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/twirl.vep https://cdn.nsb.gg/assets/samples/video.mp4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/twirl.vep @cakedan`,
        ],
        id: Formatter.Commands.MediaAIVManipulationVep.COMMAND_ID,
        usage: '<.vep url or attachment> ?<emoji,user:id|mention|name,url>',
      },
      type: Parameters.filePayload('.vep'),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: vep, url } = args.payload || {};
    if (url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: url});
    }
    return !!url && !!vep;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: vep, url } = args.payload || {};
    if (!vep) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_vep_found'));
    }
    return super.onCancelRun(context, {url});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const { file: vep, url } = args.payload!;
    return Formatter.Commands.MediaAIVManipulationVep.createMessage(context, {
      url: url!,
      vep: vep!,
    });
  }
}

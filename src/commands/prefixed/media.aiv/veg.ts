import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'veg';

// the label is `payload` instead of the media command's `url`, both are here so the hooks below can override its own
export interface CommandArgsBefore {
  nocutoff?: boolean,
  payload?: Parameters.FilePayload,
  url?: null | string,
}

export default class VegCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['vegas', 'vegrender', 'veg render'],
      args: [
        {name: 'nocutoff', aliases: ['nc'], type: Boolean, metadata: {description: 'Let clips on the same track overlap instead of cutting each other off'}},
      ],
      label: 'payload',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Play a Vegas project (.veg) with every one of its sources replaced by an Audio/Image/Video',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/project.veg https://notsobot.com/some/video/file.mp4`,
          `${COMMAND_NAME} https://notsobot.com/some/project.veg @cake#0001 -nocutoff`,
        ],
        id: Formatter.Commands.MediaAIVManipulationVeg.COMMAND_ID,
        usage: '<.veg url or attachment> ?<emoji,user:id|mention|name,url> (-nocutoff)',
      },
      type: Parameters.filePayload('.veg'),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: veg, url } = args.payload || {};
    if (url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: url});
    }
    return !!url && !!veg;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: veg, url } = args.payload || {};
    if (!veg) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_veg_found'));
    }
    return super.onCancelRun(context, {url});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const { file: veg, url } = args.payload!;
    return Formatter.Commands.MediaAIVManipulationVeg.createMessage(context, {
      cutoff: !args.nocutoff,
      url: url!,
      veg: veg!,
    });
  }
}

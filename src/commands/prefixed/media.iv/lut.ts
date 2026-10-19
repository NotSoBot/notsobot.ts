import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaLUTInterpolations } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'lut';

// the label is `payload` instead of the media command's `url`, both are here so the hooks below can override its own
export interface CommandArgsBefore {
  interpolation?: MediaLUTInterpolations,
  payload?: Parameters.FilePayload,
  strength?: number,
  url?: null | string,
}

export default class LUTCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['applylut'],
      args: [
        {aliases: ['i'], name: 'interpolation', type: Parameters.oneOf({choices: MediaLUTInterpolations})},
        {aliases: ['s'], name: 'strength', type: 'float', metadata: {description: '0 to 1'}},
      ],
      label: 'payload',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Color grade an Image or Video with a .cube LUT',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/grade.cube notsobot`,
          `${COMMAND_NAME} https://notsobot.com/some/grade.cube @cake#0001 -strength 0.5`,
        ],
        id: Formatter.Commands.MediaIVManipulationLUT.COMMAND_ID,
        usage: '<.cube url or attachment> ?<emoji,user:id|mention|name,url> (-interpolation <MediaLUTInterpolations>) (-strength <float>)',
      },
      type: Parameters.filePayload('.cube', {audio: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: cube, url } = args.payload || {};
    if (url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: url});
    }
    return !!url && !!cube;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { file: cube, url } = args.payload || {};
    if (!cube) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_cube_found'));
    }
    return super.onCancelRun(context, {url});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const { file: cube, url } = args.payload!;
    return Formatter.Commands.MediaIVManipulationLUT.createMessage(context, {
      cube: cube!,
      interpolation: args.interpolation,
      strength: args.strength,
      url: url!,
    });
  }
}

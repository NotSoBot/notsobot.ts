import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'url';

export interface CommandArgs {
  audio?: boolean,
  image?: boolean,
  value: string,
  video?: boolean,
}

export default class URLCommand extends BaseCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'audio', aliases: ['a'], type: Boolean},
        {name: 'image', aliases: ['i'], type: Boolean},
        {name: 'video', aliases: ['v'], type: Boolean},
      ],
      label: 'value',
      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Get the url of an image, video or audio (the last one in chat, a reply, a user\'s avatar or an emoji)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -video`,
          `${COMMAND_NAME} -audio -video`,
          `${COMMAND_NAME} @user`,
        ],
        id: Formatter.Commands.ToolsUrl.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-audio) (-image) (-video)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    // the flags pick which kinds of media count (none given, any), so the media is found here instead of by the
    // command's `type`, whose search options are fixed
    const any = !(args.audio || args.image || args.video);
    const findUrl = Parameters.lastMediaUrl({
      audio: any || !!args.audio,
      image: any || !!args.image,
      video: any || !!args.video,
    });

    const url = await findUrl(args.value, context);
    if (!url) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate((url === null) ? 'errors.invalid_user_or_url' : 'errors.no_media_found'));
    }
    return Formatter.Commands.ToolsUrl.createMessage(context, {url});
  }
}

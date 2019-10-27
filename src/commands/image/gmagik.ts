import { Command, Utils } from 'detritus-client';

import { imageMagikGif} from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { Parameters, formatMemory, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  url: string,
}


export default (<Command.CommandOptions> {
  name: 'gifmagik',
  aliases: ['gifmagic', 'gmagik', 'gmagic'],
  label: 'url',
  metadata: {
    examples: ['gifmagik', 'gifmagik notsobot'],
    type: CommandTypes.IMAGE,
    usage: 'gifmagik ?<emoji|id|mention|name|url>',
  },
  type: Parameters.lastImageUrl,
  onBefore: (context) => !!(context.channel && context.channel.canEmbedLinks),
  onCancel: (context) => context.reply('⚠ Unable to send files in this channel.'),
  onBeforeRun: (context, args) => !!args.url,
  onCancelRun: (context, args) => {
    if (args.url === undefined) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    } else {
      return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
    }
  },
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const resize = await imageMagikGif(context, {url: args.url});
    const {
      'content-length': size,
      'content-type': contentType,
      'x-dimensions-height': height,
      'x-dimensions-width': width,
      'x-extension': extension,
    } = resize.headers;

    const filename = `resized.${extension}`;
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setImage(`attachment://${filename}`);
    embed.setFooter(`${width}x${height}, ${formatMemory(parseInt(size), 2)}`);

    return context.reply({embed, file: {contentType, filename, data: resize.data}});
  },
  onRunError,
  onTypeError,
});

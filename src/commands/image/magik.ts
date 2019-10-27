import { Command, Utils } from 'detritus-client';

import { imageMagik} from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { Parameters, formatMemory, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  url: string,
}


export default (<Command.CommandOptions> {
  name: 'magik',
  aliases: ['magic'],
  label: 'url',
  metadata: {
    examples: ['magik', 'magik notsobot'],
    type: CommandTypes.IMAGE,
    usage: 'magik ?<emoji|id|mention|name|url>',
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

    const resize = await imageMagik(context, {url: args.url});
    console.log(resize.headers);
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

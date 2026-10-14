import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { mediaAIVToolsExif } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, displayReply, formatMemory, splitArray } from '../../../utils';


export const COMMAND_ID = 'tools.exif';

export interface CommandArgs {
 url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const response = await mediaAIVToolsExif(context, args);
  const { channels, metadata } = response;

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('tools_exif.media_exif_information');
  payload.footerIconUrl = EmbedBrands.NOTSOBOT;

  if (metadata.mimetype.startsWith('image/')) {
    const channel = channels.image[0]!;

    const description: Array<string> = [];
    description.push(translate('tools_exif.color_profile', {interpretation: channel.interpretation}));
    description.push(translate('tools_exif.dimensions_x', {height: metadata.height, width: metadata.width}));
    if (channel.frames !== 1) {
      // delay can be missing/empty for some animated formats
      const delays = channel.delay || [];
      let delay = (delays.length) ? delays[0]!.toLocaleString() : translate('common.unknown');
      if (delays.some((x) => x !== delays[0]!)) {
        delay = delays.join(', ');
      }

      description.push(translate('tools_exif.duration_milliseconds', {duration: metadata.duration.toLocaleString(language)}));
      description.push(translate('tools_exif.frames', {frames: metadata.frames.toLocaleString(language)}));
      description.push(translate('tools_exif.frame_delay', {delay: delay}));
      description.push(translate('tools_exif.loops', {loop: (channel.loop) ? translate('common.yes') : translate('common.no')}));
    }
    description.push(translate('tools_exif.mimetype', {mimetype: metadata.mimetype}));
    description.push(translate('tools_exif.size', {formatMemory: formatMemory(metadata.size)}));
    
    if (channel._data['gif-comment']) {
      description.push('');
      description.push(translate('tools_exif.comment'));
      description.push(Markup.codeblock(channel._data['gif-comment']))
    }

    payload.description = description.join('\n');
  } else {
    {
      const description: Array<string> = [];
      if (response.metadata.mimetype.startsWith('video/')) {
        description.push(translate('tools_exif.dimensions_x', {height: metadata.height, width: metadata.width}));
      }
      description.push(translate('tools_exif.duration_milliseconds', {duration: metadata.duration.toLocaleString(language)}));
      description.push(translate('tools_exif.mimetype', {mimetype: metadata.mimetype}));
      description.push(translate('tools_exif.size', {formatMemory: formatMemory(metadata.size)}));

      payload.description = description.join('\n');
    }

    for (let index in channels.audio) {
      const channel = channels.audio[index];

      const description: Array<string> = [];
      description.push(translate('tools_exif.bitrate', {bit_rate: channel.bit_rate.toLocaleString(language)}));
      description.push(translate('tools_exif.channels', {channels: channel.channels}));
      description.push(translate('tools_exif.codec', {codec: channel.codec, codec_tag: channel.codec_tag}));
      description.push(translate('tools_exif.codec_description', {codec_description: channel.codec_description}));
      description.push(translate('tools_exif.frames', {frames: channel.frames.toLocaleString(language)}));
      description.push(translate('tools_exif.sample_rate', {sample_rate: channel.sample_rate.toLocaleString(language)}));

      let title = translate('tools_exif.audio_stream');
      if (channels.audio.length !== 1) {
        title = `${title} ${parseInt(index) + 1}`;
      }
      payload.fields!.push({inline: true, name: title, value: description.join('\n')});
    }

    for (let index in channels.video) {
      const channel = channels.video[index];

      const description: Array<string> = [];
      description.push(translate('tools_exif.bitrate', {bit_rate: channel.bit_rate.toLocaleString(language)}));
      description.push(translate('tools_exif.codec', {codec: channel.codec, codec_tag: channel.codec_tag}));
      description.push(translate('tools_exif.codec_description', {codec_description: channel.codec_description}));
      if (channel.rotate) {
        description.push(translate('tools_exif.dimensions_x_rotate_degrees', {height: channel.height, rotate: channel.rotate, width: channel.width}));
      } else {
        description.push(translate('tools_exif.dimensions_x', {height: channel.height, width: channel.width}));
      }
      description.push(translate('tools_exif.frames', {frames: channel.frames.toLocaleString(language)}));
      description.push(translate('tools_exif.frames_per_second', {frames_per_second: channel.frames_per_second.toLocaleString(language)}));
      description.push(translate('tools_exif.pixel_format', {pixel_format: channel.pixel_format}));

      let title = translate('tools_exif.video_stream');
      if (channels.video.length !== 1) {
        title = `${title} ${parseInt(index) + 1}`;
      }
      payload.fields!.push({inline: true, name: title, value: description.join('\n')});
    }
  }

  if (response.exif.length) {
    const exif = response.exif.map((field) => {
      field.name = field.name.split('-').pop() as string;
      return field;
    }).sort((x, y) => x.name.localeCompare(y.name));

    const split = splitArray<any>(exif, 3);
    for (let i = 0; i < split.length; i++) {
      const fields = split[i];
      const description: Array<string> = [];

      for (let field of fields) {
        let value: string;
        if (field.description === field.value) {
          value = field.value;
        } else {
          value = `${field.value} (${field.description})`;
        }
        if (value) {
          description.push(`**${field.name.split('-').pop()}**`);
          description.push(`-> ${value}`);
        }
      }

      const title = (!i) ? translate('tools_exif.exif_data') : '\u200b';
      payload.fields!.push({inline: true, name: title, value: description.join('\n') || '\u200b'});
    }
    if (response.url) {
      payload.image = response.url;
    }
  } else {
    if (response.url) {
      payload.thumbnail = response.url;
    }
  }

  if (response._raw) {
    payload.files = [{filename: 'stuff.json', value: JSON.stringify(response._raw, null, 2)}];
  }

  return displayReply(context, payload);
}

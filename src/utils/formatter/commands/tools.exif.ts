import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { mediaAIVToolsExif } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import {
  DisplayPayload,
  displayDetails,
  displayDetailsLine,
  displayReply,
  formatMemory,
  padCodeBlockFromRows,
} from '../../../utils';


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

  const payload: DisplayPayload = {};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('tools_exif.media_exif_information');
  payload.footerIconUrl = EmbedBrands.NOTSOBOT;

  const lines: Array<string> = [];
  if (metadata.mimetype.startsWith('image/')) {
    const channel = channels.image[0]!;

    lines.push(displayDetailsLine([
      translate('tools_exif.mimetype', {mimetype: metadata.mimetype}),
      translate('tools_exif.dimensions_x', {height: metadata.height, width: metadata.width}),
      translate('tools_exif.size', {formatMemory: formatMemory(metadata.size)}),
      translate('tools_exif.color_profile', {interpretation: channel.interpretation}),
    ]));
    if (channel.frames !== 1) {
      // delay can be missing/empty for some animated formats
      const delays = channel.delay || [];
      let delay = (delays.length) ? delays[0]!.toLocaleString() : translate('common.unknown');
      if (delays.some((x) => x !== delays[0]!)) {
        delay = delays.join(', ');
      }

      lines.push(displayDetailsLine([
        translate('tools_exif.frames', {frames: metadata.frames.toLocaleString(language)}),
        translate('tools_exif.duration_milliseconds', {duration: metadata.duration.toLocaleString(language)}),
        translate('tools_exif.loops', {loop: (channel.loop) ? translate('common.yes') : translate('common.no')}),
      ]));
      lines.push(translate('tools_exif.frame_delay', {delay: delay}));
    }

    if (channel._data['gif-comment']) {
      lines.push(translate('tools_exif.comment'));
      lines.push(Markup.codeblock(channel._data['gif-comment']));
    }
  } else {
    lines.push(displayDetailsLine([
      translate('tools_exif.mimetype', {mimetype: metadata.mimetype}),
      (metadata.mimetype.startsWith('video/')) && translate('tools_exif.dimensions_x', {height: metadata.height, width: metadata.width}),
      translate('tools_exif.duration_milliseconds', {duration: metadata.duration.toLocaleString(language)}),
      translate('tools_exif.size', {formatMemory: formatMemory(metadata.size)}),
    ]));

    // each stream gets its title then its details on one line
    for (let index in channels.video) {
      const channel = channels.video[index];
      const title = (channels.video.length !== 1) ? `${translate('tools_exif.video_stream')} ${parseInt(index) + 1}` : translate('tools_exif.video_stream');
      lines.push(`**${title}**`);
      lines.push(displayDetailsLine([
        translate('tools_exif.codec', {codec: channel.codec, codec_tag: channel.codec_tag}),
        (channel.rotate) ? translate('tools_exif.dimensions_x_rotate_degrees', {height: channel.height, rotate: channel.rotate, width: channel.width}) : translate('tools_exif.dimensions_x', {height: channel.height, width: channel.width}),
        translate('tools_exif.frames_per_second', {frames_per_second: channel.frames_per_second.toLocaleString(language)}),
        translate('tools_exif.frames', {frames: channel.frames.toLocaleString(language)}),
        translate('tools_exif.bitrate', {bit_rate: channel.bit_rate.toLocaleString(language)}),
        translate('tools_exif.pixel_format', {pixel_format: channel.pixel_format}),
      ]));
      lines.push(`-# ${channel.codec_description}`);
    }

    for (let index in channels.audio) {
      const channel = channels.audio[index];
      const title = (channels.audio.length !== 1) ? `${translate('tools_exif.audio_stream')} ${parseInt(index) + 1}` : translate('tools_exif.audio_stream');
      lines.push(`**${title}**`);
      lines.push(displayDetailsLine([
        translate('tools_exif.codec', {codec: channel.codec, codec_tag: channel.codec_tag}),
        translate('tools_exif.channels', {channels: channel.channels}),
        translate('tools_exif.sample_rate', {sample_rate: channel.sample_rate.toLocaleString(language)}),
        translate('tools_exif.frames', {frames: channel.frames.toLocaleString(language)}),
        translate('tools_exif.bitrate', {bit_rate: channel.bit_rate.toLocaleString(language)}),
      ]));
      lines.push(`-# ${channel.codec_description}`);
    }
  }

  if (response.exif.length) {
    // one padded table instead of three columns of name/value pairs
    const rows = response.exif
      .map((field) => {
        const name = field.name.split('-').pop() as string;
        const value = (field.description === field.value) ? field.value : `${field.value} (${field.description})`;
        return [`${name}:`, value];
      })
      .filter(([, value]) => value)
      .sort((x, y) => x[0]!.localeCompare(y[0]!));
    if (rows.length) {
      lines.push(`**${translate('tools_exif.exif_data')}**`);
      lines.push(Markup.codeblock(padCodeBlockFromRows(rows, {padFunc: String.prototype.padEnd}).join('\n'), {language: 'css'}));
    }
    if (response.url) {
      payload.image = response.url;
    }
  } else if (response.url) {
    payload.thumbnail = response.url;
  }

  payload.description = displayDetails(lines);

  if (response._raw) {
    payload.files = [{filename: 'stuff.json', value: JSON.stringify(response._raw, null, 2)}];
  }

  return displayReply(context, payload);
}

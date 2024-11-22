import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { mediaAIVToolsExif } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { createUserEmbed, editOrReply, formatMemory, splitArray } from '../../../utils';


export const COMMAND_ID = 'tools.exif';

export interface CommandArgs {
 url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const response = await mediaAIVToolsExif(context, args);
  const { channels, metadata } = response;

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter('Media Exif Information', EmbedBrands.NOTSOBOT);

  if (metadata.mimetype.startsWith('image/')) {
    const channel = channels.image[0]!;

    const description: Array<string> = [];
    description.push(`**Color Profile**: ${channel.interpretation}`);
    description.push(`**Dimensions**: ${metadata.width}x${metadata.height}`);
    if (channel.frames !== 1) {
      let delay = channel.delay[0]!.toLocaleString();
      if (channel.delay.some((x) => x !== channel.delay[0]!)) {
        delay = channel.delay.join(', ');
      }

      description.push(`**Duration**: ${metadata.duration.toLocaleString()} milliseconds`);
      description.push(`**Frames**: ${metadata.frames.toLocaleString()}`);
      description.push(`**Frame Delay**: ${delay}`);
      description.push(`**Loops**: ${(channel.loop) ? 'Yes' : 'No'}`);
    }
    description.push(`**Mimetype**: ${metadata.mimetype}`);
    description.push(`**Size**: ${formatMemory(metadata.size)}`);
    
    if (channel._data['gif-comment']) {
      description.push('');
      description.push(`**Comment**`);
      description.push(Markup.codeblock(channel._data['gif-comment']))
    }

    embed.setDescription(description.join('\n'));
  } else {
    {
      const description: Array<string> = [];
      if (response.metadata.mimetype.startsWith('video/')) {
        description.push(`**Dimensions**: ${metadata.width}x${metadata.height}`);
      }
      description.push(`**Duration**: ${metadata.duration.toLocaleString()} milliseconds`);
      description.push(`**Mimetype**: ${metadata.mimetype}`);
      description.push(`**Size**: ${formatMemory(metadata.size)}`);

      embed.setDescription(description.join('\n'));
    }

    for (let index in channels.audio) {
      const channel = channels.audio[index];

      const description: Array<string> = [];
      description.push(`**Bitrate**: ${channel.bit_rate.toLocaleString()}`);
      description.push(`**Channels**: ${channel.channels}`);
      description.push(`**Codec**: ${channel.codec} (${channel.codec_tag})`);
      description.push(`**Codec Description**: ${channel.codec_description}`);
      description.push(`**Frames**: ${channel.frames.toLocaleString()}`);
      description.push(`**Sample Rate**: ${channel.sample_rate.toLocaleString()}`);

      let title = 'Audio Stream';
      if (channels.audio.length !== 1) {
        title = `${title} ${parseInt(index) + 1}`;
      }
      embed.addField(title, description.join('\n'), true);
    }

    for (let index in channels.video) {
      const channel = channels.video[index];

      const description: Array<string> = [];
      description.push(`**Bitrate**: ${channel.bit_rate.toLocaleString()}`);
      description.push(`**Codec**: ${channel.codec} (${channel.codec_tag})`);
      description.push(`**Codec Description**: ${channel.codec_description}`);
      if (channel.rotate) {
        description.push(`**Dimensions**: ${channel.width}x${channel.height} (Rotate ${channel.rotate} Degrees)`);
      } else {
        description.push(`**Dimensions**: ${channel.width}x${channel.height}`);
      }
      description.push(`**Frames**: ${channel.frames.toLocaleString()}`);
      description.push(`**Frames Per Second**: ${channel.frames_per_second.toLocaleString()}`);
      description.push(`**Pixel Format**: ${channel.pixel_format}`);

      let title = 'Video Stream';
      if (channels.video.length !== 1) {
        title = `${title} ${parseInt(index) + 1}`;
      }
      embed.addField(title, description.join('\n'), true);
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

      const title = (!i) ? 'Exif Data' : '\u200b';
      embed.addField(title, description.join('\n') || '\u200b', true);
    }
    if (response.url) {
      embed.setImage(response.url);
    }
  } else {
    if (response.url) {
      embed.setThumbnail(response.url);
    }
  }

  const options: any = {embed};
  if (response._raw) {
    options.file = {filename: 'stuff.json', value: JSON.stringify(response._raw, null, 2)};
  }

  return editOrReply(context, options);
}

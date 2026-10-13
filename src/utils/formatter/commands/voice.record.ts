import { Command, Interaction, Structures } from 'detritus-client';
import { DiscordOpusFormat } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { Writer as WavWriter } from 'wav';

import { Mimetypes } from '../../../constants';
import { displayReply, mediaReplyFromOptions } from '../../../utils';
import { getTranslator } from '../../i18n';


const VOICE_CHANNELS = DiscordOpusFormat.CHANNELS;
const VOICE_SAMPLE_RATE = DiscordOpusFormat.SAMPLE_RATE;

export const COMMAND_ID = 'voice.record';

export interface CommandArgs {
  seconds: number,
  target: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const targetId = (args.target) ? args.target.id : context.userId;


  const writer = new WavWriter({channels: VOICE_CHANNELS, sampleRate: VOICE_SAMPLE_RATE});

  const member = context.guild && context.guild.members.get(targetId);
  if (!member || !member.voiceState) {
    return displayReply(context, {description: translate('voice_record.go_join_a_voice_channel')});
  }

  const channel = member.voiceState.channel;
  if (!channel || !channel.canJoin) {
    return displayReply(context, {description: translate('voice_record.cannot_join_ur_channel')});
  }

  const { connection, isNew } = (await channel.join({
    decodeAudio: true,
    opusDecoder: {channels: VOICE_CHANNELS, sampleRate: VOICE_SAMPLE_RATE},
    opusEncoder: {channels: VOICE_CHANNELS, sampleRate: VOICE_SAMPLE_RATE},
    receive: true,
  }))!;
  connection.setSpeaking({voice: true});
  connection.sendAudioSilenceFrame();

  const cache: Array<Buffer> = [];
  writer.on('data', (buffer) => cache.push(buffer));
  const onHeader = new Promise((resolve) => {
    writer.on('header', (buffer) => {
      cache[0] = buffer;
      resolve(Buffer.concat(cache));
    });
  });

  connection.on('audio', ({data, userId}) => {
    if (userId === targetId) {
      writer.write(data);
    }
  });

  setTimeout(async () => {
    connection.kill();

    writer.end();
    const buffer = await onHeader as Buffer;
    await mediaReplyFromOptions(context, buffer, {
      content: translate('voice_record.successfully_recorded_seconds_worth_of_audio_from', {seconds: args.seconds}),
      extension: 'wav',
      filename: 'recording',
      mimetype: Mimetypes.AUDIO_WAV,
      size: buffer.length,
    });
  }, args.seconds * 1000);

  return displayReply(context, {description: translate('voice_record.ok_recording_seconds_worth_of_audio', {seconds: args.seconds})});
}

import { Command, Interaction, Structures } from 'detritus-client';
import { DiscordOpusFormat, MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { Writer as WavWriter } from 'wav';

import { editOrReply } from '../../../utils';


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
  const targetId = (args.target) ? args.target.id : context.userId;

  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const writer = new WavWriter({channels: VOICE_CHANNELS, sampleRate: VOICE_SAMPLE_RATE});

  const member = context.guild && context.guild.members.get(targetId);
  if (!member || !member.voiceState) {
    return editOrReply(context, 'go join a voice channel');
  }

  const channel = member.voiceState.channel;
  if (!channel || !channel.canJoin) {
    return editOrReply(context, 'Cannot join ur channel');
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
    const buffer = await onHeader;
    await editOrReply(context, {
      content: `Successfully recorded ${args.seconds} seconds worth of audio from you`,
      file: {filename: 'recording.wav', value: buffer},
    });
  }, args.seconds * 1000);

  return editOrReply(context, `Ok, recording ${args.seconds} seconds worth of audio`);
}

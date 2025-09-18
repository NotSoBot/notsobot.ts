import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationCaption, mediaIVManipulationUncaption } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { ImageMemeFonts } from '../../../constants';
import { jobReply, jobWaitForResult } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.recaption';

export interface CommandArgs {
  font?: ImageMemeFonts,
  text: string,
  tolerance?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  let fileResponse: RestResponsesRaw.FileResponse | undefined;
  let job = await await mediaIVManipulationUncaption(context, {
    file: args.file,
    tolerance: args.tolerance,
    url: args.url,
  }).then((x) => jobWaitForResult(context, x));
  if (job.result.response) {
    if (fileResponse) {
      job.result.response.file_old = fileResponse.file_old;
      job.result.response.took += fileResponse.took;
    }
    fileResponse = job.result.response;
  } else if (job.result.error) {
    throw new Error(`Uncaption Job Failed: ${job.result.error}`);
  } else {
    throw new Error('Uncaption Job Failed for some reason');
  }

  job = await mediaIVManipulationCaption(context, {
    file: {
      contentType: fileResponse.file.metadata.mimetype,
      filename: fileResponse.file.filename,
      value: (fileResponse.file.value) ? Buffer.from(fileResponse.file.value, 'base64') : Buffer.alloc(0),
    },
    font: args.font,
    text: args.text,
  }).then((x) => jobWaitForResult(context, x));
  if (job.result.response) {
    job.result.response.file_old = fileResponse.file_old;
    job.result.response.took += fileResponse.took;
  }
  return jobReply(context, job);
}

import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { VideoConvertCommand } from './convert';


export default class VideoGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'v';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new VideoConvertCommand(),
      ],
    });
  }
}

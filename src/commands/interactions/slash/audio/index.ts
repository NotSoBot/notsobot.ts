import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { AudioConvertCommand } from './convert';
import { AudioIdentifyCommand } from './identify';


export default class AudioGroupCommand extends BaseSlashCommand {
  description = 'Audio-Related Commands';
  name = 'a';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new AudioConvertCommand(),
        new AudioIdentifyCommand(),
      ],
    });
  }
}

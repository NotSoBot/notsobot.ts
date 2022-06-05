import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { BadMemeCommand } from './badmeme';


export default class FunGroupCommand extends BaseSlashCommand {
  description = 'Fun Commands';
  name = 'fun';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new BadMemeCommand(),
      ],
    });
  }
}

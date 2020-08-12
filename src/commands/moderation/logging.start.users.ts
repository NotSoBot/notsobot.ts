import { Permissions } from 'detritus-client/lib/constants';

import { BaseCommand } from '../basecommand';


export class LoggingStartUsersCommand extends BaseCommand {
  name = 'logging start users';

  permissionsClient = [Permissions.MANAGE_CHANNELS, Permissions.MANAGE_WEBHOOKS];
  permissions = [Permissions.MANAGE_GUILD];
}

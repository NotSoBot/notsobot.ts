import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagCommandsAddCommand } from './add';
import { TagCommandsListCommand } from './list';
import { TagCommandsMeCommand } from './me';
import { TagCommandsRemoveCommand } from './remove';
import { TagCommandsShowCommand } from './show';


export class TagCommandsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'commands';
  nameLocalizations = I18n.localizations('commands.tag.commands.name');

  constructor() {
	super({
	  options: [
		new TagCommandsShowCommand(),
		new TagCommandsAddCommand(),
		new TagCommandsListCommand(),
		new TagCommandsMeCommand(),
		new TagCommandsRemoveCommand(),
	  ],
	});
  }
}

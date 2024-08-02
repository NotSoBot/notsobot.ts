import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagCommandsShowCommand } from './show';


export class TagCommandsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'commands';

  constructor() {
	super({
	  options: [
		new TagCommandsShowCommand(),
	  ],
	});
  }
}

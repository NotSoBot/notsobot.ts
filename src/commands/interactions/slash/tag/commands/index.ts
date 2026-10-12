import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagCommandsShowCommand } from './show';


export class TagCommandsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'commands';
  nameLocalizations = I18n.localizations('commands.tag.commands.name');

  constructor() {
	super({
	  options: [
		new TagCommandsShowCommand(),
	  ],
	});
  }
}

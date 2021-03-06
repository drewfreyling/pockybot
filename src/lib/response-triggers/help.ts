import Trigger from '../../models/trigger';
import Config from '../config';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';

export default class Help extends Trigger {
	readonly commandText : string = 'help';
	readonly helpCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.helpCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let keywordsRequired = this.config.getConfig('requireValues');
		let newMessage = `## What I can do

* Give a peg 🎁!
	1. To give someone a peg type: \`@${constants.botName} peg @bob {comment}\`.\n`;

		if (keywordsRequired) {
			newMessage += '		* Note that your comment MUST include a keyword.\n'
		}

		newMessage += `* Check your status 📈!
	1. To get a PM type: \`@${constants.botName} status\` OR direct message me with \`status\`.
	1. I will PM you number of pegs you have left and who you gave it to.
* Check the available keywords 🔑!
	1. To get a list of the available keywords, type: \`@${constants.botName} keywords\` OR direct message me with \`keywords\`.
	1. I will respond in the room you messaged me in with a list of keywords.
* Ping me 🏓!
	1. To check whether I'm alive, type: \`@${constants.botName} ping\` OR direct message me with \`ping\`.
	1. I will respond in the room you messaged me in if I am alive.
* Welcome someone 👐!
	1. To get a welcome message from me, type \`@${constants.botName} welcome\` OR direct message me with \`welcome\`.
	1. I will respond in the room you messaged me in.\n`;

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners)) {
			newMessage += `* Display the winners 🏆!
	1. To display winners, type \`@${constants.botName} winners\`.
	1. I will respond in the room you messaged me in.\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Results)) {
			newMessage += `* Display the results 📃!
	1. To display results, type \`@${constants.botName} results\`.
	1. I will respond in the room you messaged me in.\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Reset)) {
			newMessage += `* Reset all pegs 🙅!
	1. To clear all pegs, type \`@${constants.botName} reset\`.
	1. I will respond in the room you messaged me in.\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Update)) {
			newMessage += `* Update names 📛!
	1. To update user names with users' current display names, type \`@${constants.botName} update\`.
	1. I will respond in the room you messaged me in.\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Finish)) {
			newMessage += `* Complete the cycle 🚲!
	1. To display winners and results and clear the database, type \`@${constants.botName} finish\`.
	1. I will respond in the room you messaged me in.\n`;
		}

		newMessage += `\nI am still being worked on, so [more features to come : )] (${constants.todoUrl})`;

		return {
				markdown: newMessage
		}
	}
}

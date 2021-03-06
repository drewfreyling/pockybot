import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import { MessageObject } from 'ciscospark/env';

export default class Welcome extends Trigger {
	readonly commandText : string = 'welcome';
	readonly welcomeCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;
	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.welcomeCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage() : Promise<MessageObject> {
		let markdown = `## Hello world!
I'm ${constants.botName}. I help you spread the word about the great work that your team mates are doing! I hand out pegs to everyone you tell me about.`;

		if (this.config.getConfig('requireValues')) {
			markdown += ` Tell us why you’re giving them a peg and include the relevant company values in your description: ${this.config.getStringConfig('keyword').join(', ')}.`;
		} else {
			markdown += ` Make sure to tell us why you’re giving them a peg.`;
		}

		markdown += `\n\nBut also... if you spot someone shaming our PC security by leaving their desktop unlocked - you can award them a shame peg!

Find out how I work by typing @${constants.botName} help`;

		return {
			markdown: markdown
		};
	}
}

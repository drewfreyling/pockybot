const constants = require(__base + `constants`);

module.exports = class welcome{
	constructor(config) {
		this.config = config;

		this.commandText = 'welcome';
		this.welcomeCommand = `(?: )*${this.commandText}(?: )*`;
	}

	isToTriggerOn(message) {
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.welcomeCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message) {
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage() {
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
import Trigger from '../../models/trigger';
import constants from '../../constants';
import XmlMessageParser from '../parsers/xmlMessageParser';
import { ParsedMessage } from '../../models/parsed-message';
import PockyDB from '../PockyDB';
import Utilities from '../utilities';
import __logger from '../logger';
import { MessageObject, CiscoSpark } from 'ciscospark/env';
import { UserRow } from '../../models/database';

// A joke option. Tells users pegs have been removed, but no pegs will actually be taken.
export default class  Unpeg extends Trigger {
	readonly unpegCommand : string;

	spark : CiscoSpark;
	database : PockyDB;
	utilities : Utilities;

	constructor(spark : CiscoSpark, database : PockyDB, utilities : Utilities) {
		super();

		this.spark = spark;
		this.database = database;
		this.utilities = utilities;

		let s = constants.optionalSpace;
		this.unpegCommand = `^${s}unpeg${s}$`;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		__logger.debug('entering the unpeg isToTriggerOn');
		let parsedMessage : ParsedMessage = XmlMessageParser.parseMessage(message);
		return this.validateTrigger(parsedMessage);
	}

	async createMessage(message : MessageObject, room : string) : Promise<MessageObject> {
		if (!this.validateMessage(message)) {
			return {
				markdown:
`I'm sorry, I couldn't understand your unpeg request. Please use the following format:
@${constants.botName} unpeg @Person this is the reason for giving you a peg`
			};
		}

		let toPersonId = message.mentionedPeople[1];
		let fromPersonId = message.personId;

		try {
			let data : UserRow = await this.database.getUser(toPersonId);
			if (!data.userid) {
				throw new Error('No to person was obtained');
			}

			let fromData : UserRow = await this.database.getUser(fromPersonId);
			if (!fromData.userid) {
				throw new Error('No from person was obtained');
			}

			return await this.returnRandomResponse(data.username, fromData.username, room);
		} catch (error) {
			return {
				markdown: 'User could not be found or created. No peg removed.'
			};
		}
	}

	validateTrigger(message : ParsedMessage) : boolean {
		if (message.toPersonId == null || message.botId !== constants.botId) {
			return false;
		}

		let pattern = new RegExp(this.unpegCommand, 'ui');
		return pattern.test(message.children[1].text());
	}

	validateMessage(message : MessageObject) : boolean {
		try {
			let parsedMessage = XmlMessageParser.getMessageXml(message);
			if (message.mentionedPeople.length !== 2 || message.mentionedPeople[0] !== constants.botId) {
				__logger.warn('Unpeg candidate message does not contain 2 people or 1st person is not bot');
				return false;
			}

			let children = parsedMessage.childNodes();
			if (children.length < 3) {
				__logger.warn('Unpeg candidate message does not contain 3 or more xml parts.')
				return false;
			}

			if(children[0].name() !== 'spark-mention' || children[2].name() !== 'spark-mention') {
				__logger.warn('Unpeg candidate message children 0 or 2 are not spark-mentions');
				return false;
			}

			let pattern = new RegExp(this.unpegCommand, 'ui');
			if (pattern.test(children[1].text())) {
				return true;
			} else {
				__logger.warn(`Unpeg candidate message child 1 does not contain unpegCommand: ${children[1].text()}`);
				return false;
			}
		} catch (e) {
			__logger.error(`Error in unpeg validateMessage:\n${e.message}`);
			throw new Error('Error in unpeg validateMessage');
		}
	}

	async returnRandomResponse(toUser : string, fromUser : string, room : string) : Promise<MessageObject> {
		let num = this.utilities.getRandomInt(7);
		toUser = (toUser || 'someone');
		fromUser = (fromUser || 'Dave');
		switch(num) {
			case 0:
				return await this.sendFollowUpResponse(`Peg removed from ${toUser}.`, 'Kidding!', room);
			case 1:
				return this.sendResponse(`It looks like ${toUser} has hidden their pegs too well for me to find them!`);
			case 2:
				return await this.sendFollowUpResponse(`${toUser}'s peg has been removed...`, `But ${toUser} stole it back!`, room);
			case 3:
				return await this.sendFollowUpResponse(`Peg given to ${toUser}`, `But ${toUser} didn't want it!`, room);
			case 4:
				return this.sendResponse(`I'm sorry ${fromUser}, I'm afraid I can't do that.`);
			case 5:
				return this.sendResponse(
`### HTTP Status Code 418: I'm a teapot.
Unable to brew coffee. Or pegs.`);
			case 6:
				return this.sendResponse(
`\`\`\`
Error: Access Denied user ${fromUser} does not have the correct privileges
	at UnPeg (unpeg.js:126)
	at EveryoneBut${fromUser.replace(' ', '')} (unpeg.js:4253)
	at ExecuteBadCode (pockybot.js:1467)
	at DecrementPegs (pockybot.js:1535)
\`\`\``
				);
			default:
				return {
					markdown: `Whoops, looks like RNGesus did not smile upon you today.`
				};
		}
	}

	private sendResponse(response : string) : MessageObject {
		return {
			markdown: response
		}
	}

	private async sendFollowUpResponse(initialResponse : string, followUp : string, room : string) : Promise<MessageObject> {
		this.spark.messages.create({
			markdown: initialResponse,
			roomId: room
		});
		await this.utilities.sleep(30);
		return {
			markdown: followUp
		};
	}
};

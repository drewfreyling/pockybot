import Trigger from '../../models/trigger';
import constants from '../../constants';
import PockyDB from '../PockyDB';
import Config from '../config';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { Role, ResultRow } from '../../models/database';

const resetCommand = '(?: )*reset(?: )*';

export default class Reset extends Trigger {
	database : PockyDB;
	config : Config;

	constructor(databaseService : PockyDB, config : Config) {
		super();

		this.database = databaseService
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Reset))) {
			return false;
		}

		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + resetCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() : Promise<MessageObject> {
		let data : ResultRow[];
		try {
			data = await this.database.returnResults();
		} catch (error) {
			__logger.error(`Error getting results:\n${error.message}`);
			return {
				markdown: `Error clearing pegs`
			};
		}

		__logger.debug('About to reset pegs, current state: ' + JSON.stringify(data));
		try {
			await this.database.reset();
			return {
				markdown: `Pegs cleared`
			};
		} catch (e) {
			__logger.error(`Error clearing pegs:\n${e.message}`);
			return {
				markdown: `Error clearing pegs`
			};
		}
	}
}

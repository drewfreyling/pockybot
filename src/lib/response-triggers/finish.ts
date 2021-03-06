import Trigger from '../../models/trigger';
import Winners from './winners';
import Results from './results';
import Reset from './reset';
import Config from '../config';
import constants from '../../constants';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';

const finishCommand = '(?: )*finish(?: )*';

export default class Finish extends Trigger {
	winners : Winners;
	results : Results;
	reset : Reset;
	config : Config;

	constructor(winnersService : Winners, resultsService : Results, resetService : Reset, config : Config) {
		super();

		this.winners = winnersService;
		this.results = resultsService;
		this.reset = resetService;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Finish))) {
			return false;
		}

		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + finishCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() : Promise<MessageObject> {
		let winnersPromise = this.winners.createMessage();
		let resultsPromise = this.results.createMessage();
		__logger.debug('Finish promises created');

		return Promise.all([winnersPromise, resultsPromise])
		.then((values : MessageObject[]) => {
			__logger.information('Winners and Results promises executed');
			return this.reset.createMessage()
			.then((data) => {
				__logger.information('Reset promise executed');
				let message = `## Winners\n\n` + values[0].markdown + '\n\n';
				message += values[1].markdown;
				message += '\n\n' + data.markdown;
				return {
					markdown: message
				};
			}).catch((error) => {
				__logger.error(`Error clearing pegs:\n${error.message}`);
				return {
					markdown: `error clearing pegs`
				};
			});
		}).catch((error) => {
			__logger.error(`Error returning winners or results:\n${error.message}`);
			return {
				markdown: `error returning winners or results`
			};
		});
	}
}

import { WebhookObject, Page } from 'ciscospark/env';
const spark = require('ciscospark/env');
import constants from '../constants';
import __logger from './logger';
import * as fs from "fs";

function filterHooks(webhooks : Page<WebhookObject>) : WebhookObject[] {
	return webhooks.items.filter((w : WebhookObject) => {
		return w.name === constants.botName + ' webhook' || w.name === constants.botName + ' direct webhook';
	});
}

function setGcloudCredentials(){
	const filePath = `${__dirname}/../../gcloud-credentials.json`;

	const credentials = `
{
  "type": "service_account",
  "project_id": "${process.env.GCLOUD_PROJECT_ID}",
  "private_key_id": "${process.env.GCLOUD_PRIVATE_KEY_ID}",
  "private_key": "${process.env.GCLOUD_PRIVATE_KEY}",
  "client_email": "${process.env.GCLOUD_CLIENT_EMAIL}",
  "client_id": "${process.env.GCLOUD_CLIENT_ID}",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "${process.env.GCLOUD_CLIENT_CERT_URL}"
}`;

	fs.writeFileSync(filePath, credentials);
	process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
}

try {
	setGcloudCredentials();
} catch(e){
	__logger.error(`Unable to create google cloud credentials:\n${e.message}`);
}

try {
	spark.webhooks.list()
		.then(async (webhooks : Page<WebhookObject>) => {
			let myHooks : WebhookObject[] = [];
			let first = true;
			do {
				if (first) {
					first = false;
				} else {
					webhooks = await webhooks.next();
				}

				myHooks = myHooks.concat(filterHooks(webhooks));
			} while (webhooks.hasNext())

			myHooks.forEach((hook : WebhookObject) => {
				spark.webhooks.remove(hook);
			});

			__logger.debug('successfully cleaned up old hooks');
		}).then(() => {
			spark.webhooks.create({
				resource: 'messages',
				event: 'created',
				filter: 'mentionedPeople=me',
				targetUrl: constants.postUrl,
				name: constants.botName + ' webhook'
			});

			spark.webhooks.create({
				resource: 'messages',
				event: 'created',
				filter: 'roomType=direct',
				targetUrl: constants.pmUrl,
				name: constants.botName + ' direct webhook'
			})
		})
		.catch(function(e) {
			__logger.error(`Error registering hooks:\n${e.message}`);
		});
} catch (e) {
	__logger.error(`Uncaught error registerhooks:\n${e.message}`);
}

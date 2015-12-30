'use strict'

let emitter = require("global-queue");
let IrisWorkflow = require('resource-managment-framework').IrisWorkflow;

class Ticket {
	constructor() {
		this.emitter = emitter;
	}

	init(config) {
		this.hosts = constellation;
		let promises = [];
		return Promise.all(promises).then((res) => {
			return Promise.resolve(true);
		});
	}

	//API
	changeState(ticket, state, reason) {}
	removeTicket(ticket, reason) {}
	getByPIN(pin) {}
	getById(id) {}
	getHistory(ticket) {}
	changePriority(ticket, priority_level, reason) {}
	setRoute(route) {}
}

module.exports = Ticket;
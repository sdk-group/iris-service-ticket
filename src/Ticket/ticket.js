'use strict'

let emitter = require("global-queue");
let TicketApi = require('resource-management-framework').TicketApi;

class Ticket {
	constructor() {
		this.emitter = emitter;
	}

	init() {
		this.iris = new TicketApi();
		this.iris.initContent();
	}

	//API
	changeState(ticket, state, reason) {
		return this.getById(ticket)
			.then((ticket_data) => {
				let tick = ticket_data[0];
				tick.state = state;
				//@TODO send history entry here
				return this.iris.setTicket(tick);
			});
	}

	removeTicket(ticket, reason) {}

	getByPIN(pin) {
		return this.iris.getTicket({
				query: {
					code: pin.toString()
				}
			})
			.then((res) => {
				return _.values(res);
			});
	}

	getById(id) {
		return this.iris.getTicket({
				keys: id.toString()
			})
			.then((res) => {
				return _.values(res);
			});
	}

	getHistory(ticket) {}

	changePriority(ticket, priority_level, reason) {
		return this.getById(ticket)
			.then((ticket_data) => {
				let tick = ticket_data[0];
				tick.priority = priority_level;
				//@TODO send history entry here
				return this.iris.setTicket(tick);
			});
	}

	setRoute(route) {}
}

module.exports = Ticket;
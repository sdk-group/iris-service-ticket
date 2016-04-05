'use strict'

let emitter = require("global-queue");
let TicketApi = require('resource-management-framework')
	.TicketApi;

class Ticket {
	constructor() {
		this.emitter = emitter;
	}

	init() {
		this.iris = new TicketApi();
		this.iris.initContent();
	}

	//API
	actionTicket({
		query,
		keys
	}) {
		return this.iris.getTicket({
			query,
			keys
		});
	}

	actionBasicPriorities() {
		return this.iris.getBasicPriorities();
	}

	actionChangeState({
		ticket,
		state,
		fields = {}
	}) {
		let allowed_transform = {
			"registered=>called": true,
			"postponed=>called": true,
			"booked=>registered": true,
			"called=>postponed": true,
			"postponed=>registered": true,
			"called=>processing": true,
			"processing=>closed": true,
			"booked=>removed": true,
			"registered=>removed": true,
			"called=>removed": true,
			"called=>expired": true,
			"booked=>expired": true,
			"processing=>postponed": true
		};
		let tick_data;
		return this.iris.getTicket({
				keys: ticket
			})
			.then((tick) => {
				tick_data = _.find(tick, (t) => (t.id == ticket || t.key == ticket));
				let old_state = tick_data.state;
				if (state === old_state && state == 'registered')
					return Promise.resolve({
						ticket: tick_data,
						log: false
					});
				if (!allowed_transform[_.join([old_state, state], "=>")] && !allowed_transform[_.join(['*', state], "=>")])
					return Promise.reject(new Error(`State change not allowed: ${old_state} => ${state}.`));
				tick_data.state = state;
				tick_data = _.merge(tick_data, fields);
				return this.iris.setTicket(tick_data);
			})
			.then((res) => {
				// console.log("SET TICK RES", res);
				if (!res[tick_data.id])
					return Promise.reject(new Error(`Failed to change state.`));
				tick_data.cas = res[tick_data.id].cas;
				return {
					ticket: tick_data,
					success: true
				};
			})
			.catch((err) => {
				// console.log("ERR CHANGE STATE", err.message, tick_data);
				return {
					success: false,
					ticket: tick_data,
					reason: err.message
				};
			});
	}


	actionByCode({
		code
	}) {
		return this.iris.getTicket({
				query: {
					code
				}
			})
			.then((res) => {
				return _.values(res);
			});
	}

	actionById({
		ticket
	}) {
		return this.iris.getTicket({
				keys: ticket
			})
			.then((res) => {
				return _.values(res);
			});
	}

	actionHistory({
		ticket
	}) {
		let events = ['call', 'register', 'book', 'remove', 'restore', 'closed', 'postpone', 'expire', 'processing'];
		return this.iris.getTicket({
				keys: ticket
			})
			.then((res) => {
				return _.filter(_.get(res, `${ticket}.history`), (ent) => !!~_.indexOf(events, ent.event_name));
			});
	}

	actionSetTicket({
		ticket
	}) {
		return this.iris.setTicket(ticket)
			.then((res) => {
				if (!res[ticket.id] || !res[ticket.id].cas)
					return Promise.reject(new Error("Failed to set ticket."));
				return {
					success: true,
					ticket
				};
			})
			.catch((err) => {
				return {
					success: false,
					reason: err.message
				}
			});
	}

	setRoute(route) {}
}

module.exports = Ticket;

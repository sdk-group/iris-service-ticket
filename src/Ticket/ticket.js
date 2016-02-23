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



	actionComputePriority({
		priority
	}) {
		let p_map = {
			'veteran': 3,
			'invalid': 2
		};
		let req = priority ? _.pick(p_map, _.keys(priority)) : {
			'default': 0
		};
		return _.max(_.values(req)) || 0;
	}

	actionCallAgain({
		user_id,
		ticket,
		workstation
	}) {
		return this.actionChangeState({
			ticket,
			state: 'called',
			user_id
		});
	}


	actionChangeState({
		ticket,
		state,
		reason = 'system',
		user_id
	}) {
		let allowed_transform = {
			"registered=>called": true,
			"postponed=>called": true,
			"booked=>registered": true,
			"called=>postponed": true,
			"postponed=>registered": true,
			"called=>processing": true,
			"processing=>closed": true,
			"processing=>postponed": true
		};
		let tick_data;
		return this.iris.getTicket({
				keys: ticket
			})
			.then((tick) => {
				tick_data = _.find(tick, (t) => (t.id == ticket || t.key == ticket));
				let old_state = tick_data.state;
				if (state === old_state)
					return Promise.resolve({
						ticket: tick_data,
						log: false
					});
				if (!allowed_transform[_.join([old_state, state], "=>")])
					return Promise.reject(new Error("State change not allowed."));
				tick_data.state = state;

				return this.iris.setTicket(tick_data);
			})
			.then(() => {
				return {
					ticket: tick_data,
					success: true
				};
			})
			.catch((err) => {
				return {
					success: false,
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
		return this.emitter.addTask('history', {
				_action: 'get-entries',
				query: {
					object: ticket
				}
			})
			.then((res) => {
				return _.values(res);
			});
	}

	actionSetTicket({
		ticket
	}) {
		return this.iris.setTicket(ticket)
			.then((res) => {
				if (!res[ticket.id].cas)
					return Promise.reject(new Error("Failed to set ticket booking date."));
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

	actionSetPriority({
		ticket,
		priority
	}) {
		let data = {

		};
		return this.iris.getTicket({
				keys: ticket
			})
			.then((res) => {
				let tick = _.find(res, (t) => (t.id == ticket || t.key == ticket));
				tick.priority = priority_level;
				return this.iris.setTicket(tick);
			})
			.then((res) => {
				if (!res[ticket].cas)
					return Promise.reject(new Error("Failed to set ticket priority."));
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

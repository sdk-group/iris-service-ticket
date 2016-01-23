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
	actionCallAgain({
		user_id, ticket
	}) {
		let data = {

		};
		return this.iris.getTicket({
				keys: ticket
			})
			.then((tick) => {
				this.emitter.emit('broadcast', {
					module: 'ticket',
					event: 'call',
					data: {
						ticket: tick[ticket]
					}
				});
				return this.emitter.addTask('history', {
					_action: 'set-entries',
					data
				});
			});
	}


	actionChangeState({
		ticket, state, reason = 'system'
	}) {
		let allowed_transform = {
			"registered=>called": true,
			"booked=>registered": true,
			"called=>postponed": true,
			"postponed=>registered": true,
			"called=>processing": true,
			"processing=>closed": true
		};
		return this.iris.getTicket({
				keys: ticket
			})
			.then((tick) => {
				let data = tick[ticket];
				let old_state = data.state;
				if(!(state === old_state) && !allowed_transform[_.join([old_state, state], "=>")])
					return Promise.reject(new Error("State change not allowed."));
				data.state = state;
				return this.iris.setTicket(data);
			})
			.then((res) => {
				return {
					success: !!(res[ticket] && res[ticket].cas)
				};
			})
			.catch((err) => {
				return {
					success: false
				};
			});
	}

	removeTicket({
		ticket, reason
	}) {}

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

	getHistory({
		ticket
	}) {
		return this.emitter.addTask('history', {
			_action: 'get-entries',
			object: ticket
		});
	}

	actionSetPriority({
		ticket, priority, reason
	}) {
		let data = {

		};
		return this.iris.getTicket({
				keys: ticket
			})
			.then((res) => {
				let tick = res[ticket];
				tick.priority = priority_level;
				return this.iris.setTicket(tick);
			})
			.then((res) => {
				if(!res[ticket].cas)
					return Promise.reject(new Error("Failed to set ticket priority."));
				return this.emitter.addTask('history', {
					_action: 'set-entries',
					data
				});
			})
			.catch((err) => {
				return {
					success: false;
				}
			});
	}

	setRoute(route) {}
}

module.exports = Ticket;
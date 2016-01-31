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
	logHistory(data) {
		return this.emitter.addTask('history', {
			_action: 'set-entries',
			data
		});
	}

	actionTicket({
		query, keys
	}) {
		return this.iris.getTicket({
			query, keys
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
		user_id, ticket, workstation
	}) {
		let data = {

		};



		return this.logHistory(data);
	}


	actionChangeState({
		ticket, state, reason = 'system', user_id
	}) {
		let allowed_transform = {
			"registered=>called": true,
			"booked=>registered": true,
			"called=>postponed": true,
			"postponed=>registered": true,
			"called=>processing": true,
			"processing=>closed": true
		};
		let data = {
			event_name: "ticket.change-state",
			subject: user_id,
			reason
		};
		return this.iris.getTicket({
				keys: ticket
			})
			.then((tick) => {
				console.log("FOUND TO CHANGE", tick, ticket);
				let data = _.find(tick, (t) => (t.id == ticket || t.key == ticket));
				let old_state = data.state;
				if(!(state === old_state) && !allowed_transform[_.join([old_state, state], "=>")])
					return Promise.reject(new Error("State change not allowed."));
				data.state = state;
				return this.iris.setTicket(data);
			})
			.then((res) => {
				if(!(res[ticket] && res[ticket].cas))
					return Promise.reject(new Error("Failed to set ticket state."));
				return this.logHistory(data);
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
				return this.logHistory(data);
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
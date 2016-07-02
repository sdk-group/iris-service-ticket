'use strict'


let TicketApi = require('resource-management-framework')
	.TicketApi;

class Ticket {
	constructor() {
		this.emitter = message_bus;
	}

	init() {
		this.iris = new TicketApi();
		this.iris.initContent();
	}

	launch() {
			this.emitter.on('ticket.emit.state', ({
				ticket,
				org_addr,
				workstation,
				event_name
			}) => {
				let to_join = ['ticket', event_name, org_addr, workstation];
				console.log("EMITTING TICKSTATE", _.join(to_join, "."));
				this.emitter.emit('broadcast', {
					event: _.join(to_join, "."),
					data: ticket
				});
			});
			return Promise.resolve(true);
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
		fields = {},
		unset = []
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
			"processing=>postponed": true,
			"processing=>registered": true
		};
		let tick_data;
		return this.iris.getTicket({
				keys: ticket
			})
			.then((tick) => {
				tick_data = _.find(tick, (t) => (t.id == ticket));
				let old_state = tick_data.state;
				if (state === old_state && state == 'registered')
					return tick;
				if (!allowed_transform[_.join([old_state, state], "=>")] && !allowed_transform[_.join(['*', state], "=>")])
					return Promise.reject(new Error(`State change not allowed: ${old_state} => ${state}.`));
				tick_data.state = state;
				tick_data = _.merge(tick_data, fields);
				_.map(unset, v => _.unset(tick_data, v));
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
				console.log("ERR CHANGE STATE", err.message);
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
		return this.iris.getCodeLookup(code)
			.then((res) => {
				console.log(res);
				if (!res) {
					return Promise.resolve({});
				}
				return this.iris.getTicket({
					keys: res
				});
			})
			.then(tickets => {
				let ticket = _.head(_.values(tickets));
				if (!ticket) {
					return {
						success: false,
						reason: "Ticket not found"
					};
				}

				return {
					ticket: ticket,
					success: true
				}
			});
	}

	actionById({
		ticket
	}) {
		return this.iris.getTicket({
				keys: ticket
			})
			.then((res) => _.values(res));
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
				global.logger && logger.error(
					err, {
						module: 'ticket',
						method: 'set-ticket',
						ticket
					});
				return {
					success: false,
					reason: err.message
				}
			});
	}

	setRoute(route) {}
}

module.exports = Ticket;
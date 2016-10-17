'use strict'


let TicketApi = require('resource-management-framework')
	.TicketApi;
// let Patchwerk = require('patchwerk');


class Ticket {
	constructor() {
		this.emitter = message_bus;
	}

	init() {
		this.iris = new TicketApi();
		this.iris.initContent();

		// this.patchwerk = Patchwerk(this.emitter);
	}

	launch() {
			this.emitter.on('ticket.emit.state', ({
				ticket,
				org_addr,
				workstation,
				event_name
			}) => {
				let to_join = ['ticket', event_name, org_addr, workstation];
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

	actionCanChangeState({
		from,
		to,
		operation
	}) {
		let allowed_transform = {
			"registered=>called": true,
			"registered=>removed": true,
			"registered=>registered": true,
			"postponed=>called": true,
			"postponed=>registered": true,
			"booked=>registered": true,
			"booked=>removed": true,
			"booked=>expired": true,
			"called=>registered": true,
			"called=>expired": true,
			"called=>processing": true,
			"called=>postponed": true,
			"processing=>closed": true,
			"processing=>postponed": true,
			"processing=>registered": true
		};
		console.log("----------------------------------------------------------------", from, to, operation);
		if (operation == 'activate') {
			if (from == 'processing' || from == 'called' || from == 'postponed')
				return false;
		}
		if (operation == 'route-operator') {
			if (from == 'registered' || from == 'postponed')
				return false;
			if (from == 'processing' || from == 'called')
				return true;
		}
		if (operation == 'remove') {
			// if (from == 'processing' || from == 'called' || from == 'closed' || from == 'expired')
			// 	return false;
			// else
			// 	return true;
			to = 'removed';
		}

		if (operation == 'route-reception') {
			if (from == 'registered' || from == 'postponed')
				return true;
			if (from == 'processing' || from == 'called')
				return false;
		}
		if (operation == 'postpone-pack' || operation == 'expire-pack') {
			if (from == 'registered' || from == 'postponed')
				return true;
		}
		if (operation == 'restore')
			if (from == 'closed' || from == 'expired')
				return true;
		return !!allowed_transform[_.join([from, to], "=>")] && !allowed_transform[_.join(['*', to], "=>")];
	}

	actionChangeState({
		ticket,
		state,
		operation,
		fields = {},
		unset = [],
		unlock = []
	}) {

		let tick_data;
		return this.iris.getTicket({
				keys: ticket
			})
			.then((tick) => {
				tick_data = _.find(tick, (t) => (t.id == ticket));
				let old_state = tick_data.state;
				if (!this.actionCanChangeState({
						from: old_state,
						to: state,
						operation: operation
					}))
					return Promise.reject(new Error(`State change not allowed: ${old_state} => ${state}.`));
				tick_data.state = state;
				_.map(unlock, nm => {
					_.unset(tick_data, ['locked_fields', nm]);
				});
				_.map(unset, v => {
					let lock = _.get(tick_data, ['locked_fields', v], false);
					if (!lock) {
						_.set(tick_data, v, null);
					} else {
						tick_data[v] = lock;
					}
				});
				tick_data = _.merge(tick_data, fields);
				return this.iris.setTicket(tick_data);
			})
			.then((res) => {
				// console.log("SET TICK RES", res);
				if (!res[tick_data.id])
					return Promise.reject(new Error(`Failed to change state: cannot save ticket.`));
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
		code
	}) {
		let tick;
		return this.actionByCode({
				code
			})
			.then(({
				success,
				reason,
				ticket
			}) => {
				if (!success)
					return Promise.reject(new Error(reason));
				tick = ticket;
				let session = ticket.session;
				return this.emitter.addTask('database.getMulti', {
					args: [[session]]
				});
			})
			.then((session) => {
				return this.emitter.addTask('database.getMulti', {
					args: [session[tick.session].value.uses]
				});
			})
			.then(tickets => {
				let fin_history = Array((tick.inheritance_counter || 0));
				_.map(tickets, ticket => {
					if (ticket.value.inherits == tick.id) {
						fin_history[ticket.value.inheritance_level - 1] = ticket.value.history;
					}
				});
				tick.history = tick.history.concat(_.flatten(fin_history));

				return {
					ticket: tick,
					success: true
				}
			})
			.catch((err) => {
				return {
					success: false,
					reason: err.message
				};
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
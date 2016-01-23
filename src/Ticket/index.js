let events = {
	queue: {
		ticket: {
			// change_state: "queue.ticket.change_state",
			// get_by_id: "queue.ticket.get_by_id",
			// get_by_pin: "queue.ticket.get_by_pin",
			// get_history: "queue.ticket.get_history",
			// change_priority: "queue.ticket.change_priority",
			// set_route: "queue.ticket.set_route"
		}
	}
}

let tasks = [
	// {
	// 	name: events.queue.ticket.change_state,
	// 	handler: 'changeState'
	// }, {
	// 	name: events.queue.ticket.get_by_id,
	// 	handler: 'getById'
	// }, {
	// 	name: events.queue.ticket.get_by_pin,
	// 	handler: 'getByPIN'
	// }, {
	// 	name: events.queue.ticket.get_history,
	// 	handler: 'getHistory'
	// }, {
	// 	name: events.queue.ticket.change_priority,
	// 	handler: 'changePriority'
	// }, {
	// 	name: events.queue.ticket.set_route,
	// 	handler: 'setRoute'
	// }
]


module.exports = {
	module: require('./ticket.js'),
	permissions: [],
	exposed: true,
	tasks: tasks,
	events: {
		group: 'queue',
		shorthands: events.queue.ticket
	}
};
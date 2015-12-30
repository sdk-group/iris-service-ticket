let tasks = [{
	name: events.queue.ticket.change_state,
	handler: 'changeState'
}, {
	name: events.queue.ticket.remove,
	handler: 'removeTicket'
}, {
	name: events.queue.ticket.get_by_pin,
	handler: 'getByPIN'
}, {
	name: events.queue.ticket.get_history,
	handler: 'getHistory'
}, {
	name: events.queue.ticket.change_priority,
	handler: 'changePriority'
}, {
	name: events.queue.ticket.set_route,
	handler: 'setRoute'
}]


module.exports = {
	module: require('./ticket.js'),
	permissions: [],
	tasks: tasks,
	events: {
		group: 'queue',
		shorthands: events.ticket
	}
};
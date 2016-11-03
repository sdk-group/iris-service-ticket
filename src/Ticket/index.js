'use strict'

let events = {
	queue: {
		ticket: {}
	}
}

let tasks = [];


module.exports = {
	module: require('./ticket.js'),
	name: 'ticket',
	permissions: [],
	exposed: true,
	tasks: tasks,
	events: {
		group: 'ticket',
		shorthands: events.queue.ticket
	}
};
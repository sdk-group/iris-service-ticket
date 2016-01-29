'use strict'

let events = {
	queue: {
		ticket: {}
	}
}

let tasks = [];


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
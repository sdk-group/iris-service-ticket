'use strict'

let Ticket = require("./Ticket/ticket");
let config = require("./config/db_config.json");

describe("Ticket service", () => {
	let service = null;
	let bucket = null;
	before(() => {
		service = new Ticket();
		service.init({
			bucket: config.buckets.main
		});
	});
	describe("Ticket service", () => {
		it("should get a ticket by code", (done) => {
			return service.getByPIN(3033291418)
				.then((res) => {
					// console.log(res);
					expect(res).to.be.an.array;
					expect(res[0]).to.have.property('code', "3033291418");
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get a ticket by id", (done) => {
			return service.getById("iris://data#ticket-62e905a0-b11b-11e5-8903-35573aa65f8d")
				.then((res) => {
					// console.log(res);
					expect(res).to.be.an.array;
					expect(res[0]).to.have.property('id', "ticket-62e905a0-b11b-11e5-8903-35573aa65f8d");
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should change ticket state", (done) => {
			return service.changeState("iris://data#ticket-62e905a0-b11b-11e5-8903-35573aa65f8d", 2, "Awaiting")
				.then((res) => {
					console.log(res);
					return service.getById("iris://data#ticket-62e905a0-b11b-11e5-8903-35573aa65f8d")
				})
				.then((res) => {
					console.log(res);
					expect(res).to.be.an.array;
					expect(res[0]).to.have.property('id', "ticket-62e905a0-b11b-11e5-8903-35573aa65f8d");
					expect(res[0]).to.have.property('state', 2);
					return service.changeState("iris://data#ticket-62e905a0-b11b-11e5-8903-35573aa65f8d", 1, "Delayed")
				})
				.then(() => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})

		it("should change ticket priority", (done) => {
			return service.changePriority("iris://data#ticket-62e905a0-b11b-11e5-8903-35573aa65f8d", 2, "Old fart")
				.then((res) => {
					console.log(res);
					return service.getById("iris://data#ticket-62e905a0-b11b-11e5-8903-35573aa65f8d")
				})
				.then((res) => {
					console.log(res);
					expect(res).to.be.an.array;
					expect(res[0]).to.have.property('id', "ticket-62e905a0-b11b-11e5-8903-35573aa65f8d");
					expect(res[0]).to.have.property('priority', 2);
					return service.changeState("iris://data#ticket-62e905a0-b11b-11e5-8903-35573aa65f8d", 1, "Oops")
				})
				.then(() => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
	})

});
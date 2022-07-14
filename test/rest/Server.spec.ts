import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, use} from "chai";

import chaiHttp from "chai-http";
import * as fse from "fs-extra";
import express, {Application, Request, Response} from "express";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	let testZip: any;

	use(chaiHttp);

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		server.start().then((result: any) => {
			console.log("Server started successfully\n");
		}).catch((err) => {
			console.log("Server failed to start with error: " + err);
		});

		testZip = fse.readFileSync("./test/resources/archives/Courses.zip");
	});

	after(function () {
		fse.removeSync("./data");
		server.stop().then((result: any) => {
			console.log("Server stopped successfully\n");
		}).catch((err) => {
			console.log("Server stop error\n");
		});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	// Sample on how to format PUT requests

	it("PUT test for courses dataset", function () {
		try {
			return chai.request("http://localhost:4321")
				.put("/dataset/courses/courses")
				.send(testZip)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
			// and some more logging here!
		}
	});

	it("PUT test for courses dataset should fail", function () {
		try {
			return chai.request("http://localhost:4321")
				.put("/dataset/courses/courses")
				.send(testZip)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
					// some logging here please!
				});
		} catch (err) {
			console.log(err);
			expect.fail();
			// and some more logging here!
		}
	});


	// it("Delete test for courses dataset", function () {
	// 	try {
	// 		return chai.request("http://localhost:4321")
	// 			.delete("/dataset/courses")
	// 			.then(function (res) {
	// 				// some logging here please!
	// 				expect(res.status).to.be.equal(200);
	// 			})
	// 			.catch(function (err) {
	// 				console.log(err);
	// 			});
	// 	} catch (err) {
	// 		console.log(err);
	// 	}
	// });

	it("POST test for courses dataset", function () {
		try {
			const query = {
				WHERE: {
					GT: {
						courses_avg: 99
					}
				},
				OPTIONS: {
					COLUMNS: [
						"courses_dept",
						"courses_avg"
					],
					ORDER: "courses_avg"
				}
			};
			const expectedResult = {
				result: [
					{
						courses_dept: "cnps",
						courses_avg: 99.19
					},
					{
						courses_dept: "math",
						courses_avg: 99.78
					},
					{
						courses_dept: "math",
						courses_avg: 99.78
					}
				]
			};
			return chai.request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json")
				.then(function (res) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body).to.be.deep.equal(expectedResult);
					console.log("PASS");
				}).catch(function (err: any) {
					console.log(err);
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
			// and some more logging here!
		}
		// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
	});

	it("POST test should fail for invalid courses dataset", function () {
		try {
			const query = {
				WHERE: {
					GT: {}
				},
				OPTIONS: {
					COLUMNS: [
						"courses_dept",
						"courses_avg"
					],
					ORDER: "courses_avg"
				}
			};
			return chai.request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json")
				.then(function (res) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
					console.log(res.body);
				}).catch(function (err: any) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});

	it("POST test should fail for too long courses dataset", function () {
		try {
			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: [
						"courses_dept",
						"courses_id",
						"courses_avg"
					],
					ORDER: "courses_avg"
				}
			};
			return chai.request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json")
				.then(function (res) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
					console.log("LOOK HERE: ");
					console.log(res.body);
				}).catch(function (err: any) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
			expect.fail();
		}
	});
});

// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation

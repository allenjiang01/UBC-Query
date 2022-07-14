import InsightFacade from "../../src/controller/InsightFacade";
import {
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {testFolder} from "@ubccpsc310/folder-test";
import * as fs from "fs";
import * as fse from "fs-extra";


chai.use(chaiAsPromised);

describe("InsightFacade", function () {

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	const kindCourse: InsightDatasetKind = InsightDatasetKind.Courses;
	const kindRoom: InsightDatasetKind = InsightDatasetKind.Rooms;

	let validDataset: string;
	let validDataset2: string;
	let smallValidDataset: string;
	let textFile: string;
	let nonValidDataset: string;
	let someValidDataset: string;
	let noSectionDataset: string;
	let noCoursesDataset: string;
	let roomDataset: string;


	const storedValidDataset: string = "./test/resources/archives/courses.zip";
	const storedValidDataset2: string = "./test/resources/archives/courses.zip";
	const storedSmallValidDataset: string = "./test/resources/archives/smallCourses.zip";
	const storedTextFile: string = "./test/resources/archives/note";
	const storedNonValidDataset: string = "./test/resources/archives/nonValidCourses.zip";
	const storedSomeValidDataset: string = "./test/resources/archives/someValidCourses.zip";
	const storedNoSectionDataset: string = "./test/resources/archives/noSectionCourses.zip";
	const storedNoCoursesDataset: string = "./test/resources/archives/Invalid_room_index.zip";
	const storedRoomDataset: string = "./test/resources/archives/rooms.zip";

	before(function () {
		validDataset = fs.readFileSync(storedValidDataset).toString("base64");
		validDataset2 = fs.readFileSync(storedValidDataset2).toString("base64");
		smallValidDataset = fs.readFileSync(storedSmallValidDataset).toString("base64");
		textFile = fs.readFileSync(storedTextFile).toString("base64");
		nonValidDataset = fs.readFileSync(storedNonValidDataset).toString("base64");
		someValidDataset = fs.readFileSync(storedSomeValidDataset).toString("base64");
		noSectionDataset = fs.readFileSync(storedNoSectionDataset).toString("base64");
		noCoursesDataset = fs.readFileSync(storedNoCoursesDataset).toString("base64");
		roomDataset = fs.readFileSync(storedRoomDataset).toString("base64");
	});

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fse.removeSync(persistDir);
	});

	describe("Add/Remove/List Dataset", function () {
		let insightFacade: InsightFacade;

		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent from the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fse.removeSync(persistDir);
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});

		// ADD
		it("should add dataset with valid id", function () {
			const id: string = "courses";
			const expectedSet: string[] = [id];
			return insightFacade.addDataset(id, smallValidDataset, kindCourse).then((result: string[]) => {
				expect(result).to.deep.equal(expectedSet);
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});

		it("should add dataset with valid room id", function () {
			const id: string = "room";
			const expectedSet: string[] = [id];
			return insightFacade.addDataset(id, roomDataset, kindRoom).then((result: string[]) => {
				expect(result).to.deep.equal(expectedSet);
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});


		it("should add dataset with some valid json files", function () {
			const notAllJsonID: string = "someValidCourses";
			const expectedSet: string[] = [notAllJsonID];
			return insightFacade.addDataset(notAllJsonID, someValidDataset, kindCourse).then((result: string[]) => {
				expect(result).to.deep.equal(expectedSet);
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});


		it("should fail to dataset with 0 character id", function () {
			const id: string = "";
			const expectedSet: string[] = [id];
			return insightFacade.addDataset(id, smallValidDataset, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});


		it("should fail to add dataset with underscore id", function () {
			const invalidIDUnderscore: string = "12_345";
			return insightFacade.addDataset(invalidIDUnderscore, validDataset, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});


		it("should fail to add dataset with whitespace id", function () {
			const invalidIDWhitespace: string = "     ";
			return insightFacade.addDataset(invalidIDWhitespace, validDataset, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});


		it("should fail to add dataset not zip file", function () {
			const validNotZipID: string = "textFile";
			return insightFacade.addDataset(validNotZipID, textFile, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});

		it("should fail to add dataset no courses folder", function () {
			const validNotZipID: string = "textFile";
			return insightFacade.addDataset(validNotZipID, noCoursesDataset, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});

		it("should fail to add dataset with not json files", function () {
			const notJsonID: string = "nonValidCourses";
			return insightFacade.addDataset(notJsonID, nonValidDataset, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});

		it("should fail to add dataset with no sections", function () {
			const noSectionID: string = "noSectionCourses";
			return insightFacade.addDataset(noSectionID, noSectionDataset, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});

		it("should fail to add invalid dataset", function () {
			const invalidID: string = "invalid";
			const invalidDataset: string = "lll";
			return insightFacade.addDataset(invalidID, invalidDataset, kindCourse).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});

		it("should fail to add wrong kind dataset", function () {
			const ID: string = "ID";
			return insightFacade.addDataset(ID, smallValidDataset, kindRoom).then((result: string[]) => {
				expect.fail("should reject");
			}).catch((err: any) => {
				expect(err).to.be.an.instanceof(InsightError);
			});
		});


		it("should add dataset with valid & non-duplicated id to non-empty set", function () {
			const id = "courses";
			const id2 = "courses2";
			const expectedSet: string[] = [id, id2];
			return insightFacade.addDataset(id, validDataset, kindCourse).then((result: string[]) => {
				return insightFacade.addDataset(id2, smallValidDataset, kindCourse).then((result2: string[]) => {
					expect(result2).to.deep.equal(expectedSet);
				}).catch((err: any) => {
					expect.fail("Should not reject");
				});
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});


		it("should fail to add dataset with valid & duplicated id", function () {
			const id = "courses";
			return insightFacade.addDataset(id, smallValidDataset, kindCourse).then((result: string[]) => {
				return insightFacade.addDataset(id, smallValidDataset, kindCourse).then((result2: string[]) => {
					expect.fail("Should reject");
				}).catch((err: any) => {
					expect(err).to.be.an.instanceof(InsightError);
				});
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});

		// REMOVE
		it("should remove a valid dataset", function () {
			const id: string = "courses";
			const expectedID: string = "courses";
			return insightFacade.addDataset(id, smallValidDataset, kindCourse).then((result: string[]) => {
				return insightFacade.removeDataset(id).then((result2: string) => {
					expect(result2).to.deep.equal(expectedID);
				}).catch((err: any) => {
					expect.fail("Should not reject");
				});
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});


		it("should fail to remove dataset with underscore id", function () {
			const id: string = "cour_ses";
			const id2: string = "courses";
			return insightFacade.addDataset(id2, smallValidDataset, kindCourse).then((result: string[]) => {
				return insightFacade.removeDataset(id).then((result2: string) => {
					expect.fail("should reject");
				}).catch((err: any) => {
					expect(err).to.be.an.instanceof(InsightError);
				});
			}).catch((err: any) => {
				expect.fail("should not reject");
			});
		});

		it("should fail to remove dataset with whitespace id", function () {
			const id: string = "     ";
			const id2: string = "courses";
			return insightFacade.addDataset(id2, validDataset, kindCourse).then((result: string[]) => {
				return insightFacade.removeDataset(id).then(() => {
					expect.fail("should reject");
				}).catch((err: any) => {
					expect(err).to.be.an.instanceof(InsightError);
				});
			}).catch((err: any) => {
				expect.fail("should not reject");
			});
		});


		it("should fail to remove valid not added dataset", function () {
			const id = "courses";
			const id2 = "courses2";
			return insightFacade.addDataset(id, validDataset, kindCourse).then((result: string[]) => {
				return insightFacade.removeDataset(id2).then((result2: string) => {
					expect.fail("Should reject");
				}).catch((err: any) => {
					expect(err).to.be.an.instanceof(NotFoundError);
				});
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});


		it("should fail to remove same dataset multiple times", function () {
			const id = "courses";
			return insightFacade.addDataset(id, validDataset, kindCourse).then((result: string[]) => {
				return insightFacade.removeDataset(id).then((result2: string) => {
					return insightFacade.removeDataset(id).then((result3: string) => {
						expect.fail("Should reject");
					}).catch((err: any) => {
						expect(err).to.be.an.instanceof(NotFoundError);
					});
				}).catch((err: any) => {
					expect.fail("Should not reject");
				});
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});

		// LIST
		it("successfully list datasets", function () {
			const id: string = "courses";
			return insightFacade.addDataset(id, validDataset, kindCourse).then((result: string[]) => {
				return insightFacade.listDatasets().then((result2: InsightDataset[]) => {
					expect(result2).to.have.length(1);
					expect(result2[0].id).be.deep.equal(id);
					expect(result2[0].kind).be.deep.equal(kindCourse);
				}).catch((err: any) => {
					expect.fail("Should not reject");
				});
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});

		it("successfully list multiple datasets", function () {
			const id: string = "courses";
			const id2: string = "courses2";
			return insightFacade.addDataset(id, validDataset, kindCourse).then((result: string[]) => {
				return insightFacade.addDataset(id2, smallValidDataset, kindCourse).then((result2: string[]) => {
					return insightFacade.listDatasets().then((result3: InsightDataset[]) => {
						expect(result3).to.be.an.instanceof(Array);
						expect(result3).to.have.length(2);
					}).catch((err: any) => {
						expect.fail("Should not reject");
					});
				}).catch((err: any) => {
					expect.fail("Should not reject");
				});
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});


		it("successfully list no datasets added", function () {
			const id: string = "courses";
			const expectedResult: InsightDataset[] = [];
			return insightFacade.listDatasets().then((result: InsightDataset[]) => {
				expect(result).be.deep.equal(expectedResult);
			}).catch((err: any) => {
				expect.fail("Should not reject");
			});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		// before(function () {
		// 	console.info(`Before: ${this.test?.parent?.title}`);
		//
		// 	insightFacade = new InsightFacade();
		//
		// 	// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
		// 	// Will *fail* if there is a problem reading ANY dataset.
		// 	const loadDatasetPromises = [
		// 		insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", InsightDatasetKind.Courses),
		// 	];
		//
		//
		// 	return Promise.all(loadDatasetPromises);
		// });

		let insightFacade: InsightFacade;

		before(async function () {
			insightFacade = new InsightFacade();
			await insightFacade.addDataset("courses", validDataset, kindCourse);
			await insightFacade.addDataset("smallCourses", validDataset, kindCourse);
			await insightFacade.addDataset("rooms", roomDataset, kindRoom);

		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fse.removeSync(persistDir);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		testFolder<any, any[], PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries",
			{
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError(expected, actual) {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});

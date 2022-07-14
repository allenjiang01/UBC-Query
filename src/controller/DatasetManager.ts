import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import JSZip, {JSZipObject} from "jszip";
import {Section} from "./Section";
import * as fse from "fs-extra";
import * as parse5 from "parse5";
import {Building} from "./Building";
import * as http from "http";
import {Room} from "./Room";
import {ChildNode} from "parse5";
import RoomsManager from "./RoomsManager";
import SectionsManager from "./SectionsManager";


export default class DatasetManager {

	public ids: string[];
	public datasets: InsightDataset[];
	public jszip = new JSZip();
	public sectionsMap = new Map();
	public roomsMap = new Map();
	public mapList = [this.sectionsMap, this.roomsMap];

	constructor() {
		this.ids = [];
		this.datasets = [];
	}

	public getItemsList(idGiven: string): any[] {
		let returnedList: any[];
		if (idGiven === "rooms") {
			returnedList = this.getRoomsList(idGiven);
		} else {
			returnedList = this.getSectionsList(idGiven);
		}
		return returnedList;
	}

	public getSectionsList(idGiven: string): Section[] {
		let whichListToUse = this.ids.indexOf(idGiven);
		let secList: Section[] =  [];
		let counter: number = 0;
		for (let sectionList of this.mapList[0].values()) {
			if (counter === whichListToUse) {
				for (let sec of sectionList) {
					secList.push(sec);
				}
			}
			counter++;
		}
		return secList;
	}

	public getRoomsList(idGiven: string): Room[] {
		// let whichListToUse = this.ids.indexOf(idGiven);
		let rooms: Room[] = [];
		// let counter: number = 0;
		for (let roomList of this.mapList[1].values()) {
			for (let room of roomList) {
				rooms.push(room);
			}
		}
		return rooms;
	}


	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.datasets);
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			return this.checkInvalidID(id).then((str: string) => {
				if (!this.ids.includes(id)) {
					return reject(new NotFoundError("id not found"));
				}
				const index = this.ids.indexOf(id);
				this.datasets.splice(index, 1);
				this.ids.splice(index, 1);
				this.mapList[0].delete(id);
				this.mapList[1].delete(id);
				fse.removeSync("./data/" + id);
				return resolve(id);
			}).catch((err: any) => {
				return reject(new InsightError("Invalid id"));
			});
		});
	}

	public readNewDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			let promise = this.checkInvalidID(id).then((str: string) => {
				return this.checkExistingID(id);
			}).then((str1: string) => {
				return this.checkKind(kind);
			}).then((str2: string) => {
				return this.unzipFile(content);
			}).then((unzip: JSZip) => {
				if (kind === InsightDatasetKind.Courses) {
					if (this.jszip.folder(/courses/).length <= 0 || this.jszip.folder("courses") == null) {
						reject(new InsightError("courses folder null"));
					}
					return this.getCourseContent(id, unzip);
				} else {
					if (this.jszip.folder(/rooms/).length <= 0 || this.jszip.folder("rooms") == null) {
						reject(new InsightError("rooms folder null"));
					}
					return this.getBuildingContent(id, unzip);
				}
			}).then((result: any) => {
				fse.ensureFileSync("./data/" + id);
				fse.writeFileSync("./data/" + id, JSON.stringify(result),);
				this.ids.push(id);
				return resolve(this.ids);
			}).catch((error: any) => {
				return reject(error);
			});
		});
	}

	public getCoursesZipFile(unzip: JSZip): Promise<string[]> {
		let courseList: any[] = [];
		unzip.folder("courses")?.forEach((relativePath: string, file: JSZipObject) => {
			const coursePromise = file.async("text");
			// console.log("current courseList length: " + courseList.length);
			courseList.push(coursePromise);
		});
		return Promise.all(courseList);
	}

	public getCourseContent(idThis: string, unzip: any): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				let promise = this.getCoursesZipFile(unzip).then((courseList: any[]) => {
					let parsedCourseList: any[] = [];
					let numRows: number = 0;
					for (const item1 of courseList) {
						try {
							const currCourse = JSON.parse(item1);
							const sectionList = currCourse["result"];
							if (sectionList.length > 0) {
								for (const item of sectionList) {
									const avg: number = item["Avg"];
									const dept: string = item["Subject"];
									const id: string = item["Course"];
									const instructor: string = item["Professor"];
									const title: string = item["Title"];
									const pass: number = item["Pass"];
									const fail: number = item["Fail"];
									const audit: number = item["Audit"];
									const uuid: string = item["id"];
									let year: number = item["Year"];
									if (item["Section"] === "overall") {
										year = 1900;
									}
									const currSection = {avg, dept, id, instructor, title, pass, fail, audit, uuid,
										year};
									parsedCourseList.push(currSection);
									numRows++;
								}
							}
						} catch (e) {
							console.log("file not json");
						}
					}
					if (parsedCourseList.length === 0) {
						return reject(new InsightError("No sections"));
					}
					let id = idThis;
					const dataSet: InsightDataset = {id, kind: InsightDatasetKind.Courses, numRows: numRows};
					this.datasets.push(dataSet);
					this.mapList[0].set(idThis, parsedCourseList);
					return resolve(parsedCourseList);
				});
			} catch (error: any) {
				return reject(new InsightError("error thrown"));
			}
		});
	}

	public getBuildingContent(id: string, unzip: JSZip) {
		return new Promise((resolve, reject) => {
			try {
				let roomsManager = new RoomsManager();
				return roomsManager.getBuildingContent(id, unzip).then((result: any) => {
					this.datasets.push(roomsManager.dataset);
					this.mapList[1].set(id, result);
					return resolve(result);
				}).catch((e: any) => {
					return reject(new InsightError("error thrown"));
				});
			} catch (e: any) {
				return reject(new InsightError());
			}
		});
	}

	public unzipFile(content: string): Promise<JSZip> {
		return new Promise<JSZip>((resolve, reject) => {
			this.jszip.loadAsync(content, {base64: true, createFolders: true}).then((unzip: JSZip) => {
				return resolve(unzip);
			}).catch((err) => {
				return reject(new InsightError("Invalid zip file"));
			});
		});
	}

	public checkKind(kind: InsightDatasetKind): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (kind === InsightDatasetKind.Courses || kind === InsightDatasetKind.Rooms) {
				return resolve("Kind is valid");
			} else {
				return reject(new InsightError("Kind is invalid"));
			}
		});
	}


	public checkInvalidID(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (id.includes("_") || this.checkAllWhiteSpace(id) || id === "" || id === null || id === undefined) {
				return reject(new InsightError("ID is invalid"));
			} else {
				return resolve("ID is valid");
			}
		});
	}

	// Source: https://stackoverflow.com/questions/10261986/how-to-detect-string-which-contains-only-spaces/50971250
	public checkAllWhiteSpace(id: string): boolean {
		return !/\S/.test(id);
	}

	public checkExistingID(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (this.ids.includes(id)) {
				return reject(new InsightError("ID already exists"));
			} else {
				return resolve("ID is valid");
			}
		});
	}
}

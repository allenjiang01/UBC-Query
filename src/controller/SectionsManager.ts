import {Room} from "./Room";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Section} from "./Section";
import JSZip, {JSZipObject} from "jszip";

export default class SectionsManager {
	public sections: Section[];
	public dataset: InsightDataset;

	constructor() {
		this.sections = [];
		let id = "courses";
		let kind = InsightDatasetKind.Courses;
		let numRows = 0;
		this.dataset = {id, kind, numRows};
	}

	public makeSection
	(avg: any, dept: any, courseID: any, instructor: any, title: any, pass: any, fail: any, audit: any, uuid: any, year:
		any): Section {
		return {avg, dept, courseID, instructor, title, pass, fail, audit, uuid, year};
	}

	public getCourseContent(id: string, unzip: JSZip): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				let promise = this.getCoursesZipFile(unzip).then((courseList: any[]) => {
					let numRows: number = 0;
					// FOR EACH COURSE
					for (const item1 of courseList) {
						try {
							JSON.parse(item1);
							const currCourse = JSON.parse(item1);
							const sectionList = currCourse["result"];
							if (sectionList.length > 0) {
								// FOR EACH SECTION
								for (const item of sectionList) {
									const avg: number = item["Avg"];
									const dept: string = item["Subject"];
									const courseID: string = item["Course"];
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
									const currSection = this.makeSection(avg, dept, courseID, instructor, title,
										pass, fail, audit, uuid, year);
									this.sections.push(currSection);
									numRows++;
								}
							}
						} catch (e) {
							console.log("file not json");
						}
					}
					if (this.sections.length === 0) {
						return reject(new InsightError("No sections"));
					}
					this.dataset = {id, kind: InsightDatasetKind.Courses, numRows: numRows};
					return resolve(this.sections);
				});
			} catch (error: any) {
				return reject(new InsightError("error thrown"));
			}
		});
	}

	// public getCourseContent(id: string, unzip: JSZip): Promise<any> {
	// 	return new Promise((resolve, reject) => {
	// 		try {
	// 			let promise = this.getCoursesZipFile(unzip).then((courseList: any[]) => {
	// 				let numRows: number = 0;
	// 				// FOR EACH COURSE
	// 				for (const item1 of courseList) {
	// 					try {
	// 						JSON.parse(item1);
	// 						const currCourse = JSON.parse(item1);
	// 						const sectionList = currCourse["result"];
	// 						if (sectionList.length > 0) {
	// 							// FOR EACH SECTION
	// 							for (const item of sectionList) {
	// 								const avg: number = item["Avg"];
	// 								const dept: string = item["Subject"];
	// 								const courseID: string = item["Course"];
	// 								const instructor: string = item["Professor"];
	// 								const title: string = item["Title"];
	// 								const pass: number = item["Pass"];
	// 								const fail: number = item["Fail"];
	// 								const audit: number = item["Audit"];
	// 								const uuid: string = item["id"];
	// 								let year: number = 0;
	// 								if (item["year"] === "overall") {
	// 									year = 1900;
	// 								}
	// 								year = item["Year"];
	// 								const currSection = this.makeSection(avg, dept, courseID, instructor, title,
	// 									pass, fail, audit, uuid, year);
	// 								this.sections.push(currSection);
	// 								numRows++;
	// 							}
	// 						}
	// 					} catch (e) {
	// 						console.log("file not json");
	// 					}
	// 				}
	// 				if (this.sections.length === 0) {
	// 					return reject(new InsightError("No sections"));
	// 				}
	// 				this.dataset = {id, kind: InsightDatasetKind.Courses, numRows: numRows};
	// 				return resolve(this.sections);
	// 			});
	// 		} catch (error: any) {
	// 			return reject(new InsightError("error thrown"));
	// 		}
	// 	});
	// }

	public getCoursesZipFile(unzip: JSZip): Promise<string[]> {
		let courseList: any[] = [];
		unzip.folder("courses")?.forEach((relativePath: string, file: JSZipObject) => {
			const coursePromise = file.async("text");
			// console.log("current courseList length: " + courseList.length);
			courseList.push(coursePromise);
		});
		return Promise.all(courseList);
	}
}

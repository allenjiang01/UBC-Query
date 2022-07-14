import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import JSZip, {JSZipObject} from "jszip";
import * as fse from "fs-extra";
import {createFile} from "fs-extra";


export default class ValidationHandler {
	public ID: string = "";

	constructor() {
		/* do nothing  */
	}

	public getID(query: any): string {
		let idType = "";
		if (!(query.OPTIONS == null)) {
			if (query.OPTIONS.COLUMNS != null && query.OPTIONS.COLUMNS.length !== 0) {
				let temp = query.OPTIONS.COLUMNS[0];
				idType = temp.split("_")[0];
			}
		}
		return idType;
	}

	public checkValidity(query: any, id: string, validList: any[]) {
		this.ID = id;
		let listOfAcceptableComparators = ["GT", "EQ", "LT", "IS", "NOT"];
		let validListCourse = [id + "_dept", id + "_id", id + "_avg", id + "_instructor",
			id + "_title", id + "_pass", id + "_fail", id + "_audit", id + "_uuid", id + "_year"];
		let validListRooms = [id + "_shortname", id + "_fullname", id + "_number", id + "_name",
			id + "_address", id + "_lon", id + "_lat", id + "_seats", id + "_type", id + "_furniture", id + "_href"];

		if (query.WHERE == null) {
			return false;
		}
		if (query.OPTIONS == null) {
			return false;
		}
		if (Object.keys(query)[0] !== "WHERE") {
			return false;
		}
		if (Object.keys(query)[1] !== "OPTIONS") {
			return false;
		}
		if (validList.length === 0) {
			return false;
		}
		if (Object.keys.length > 2) {
			if (Object.keys(query)[2] !== "TRANSFORMATIONS") {
				return false;
			}
		}
		let haveTransformations = true;
		if (query.TRANSFORMATIONS == null) {
			haveTransformations = false;
		}
		let whereValid = this.checkWhereValidity(query, listOfAcceptableComparators, validList);
		let optionsValid = this.checkOptionsValidity(query, validList, haveTransformations);
		if (query.TRANSFORMATIONS != null) {
			let transformationsValid = this.checkTransformationsValidity(query, validList);
			whereValid = whereValid && transformationsValid;
		}
		if (whereValid && optionsValid) {
			return true;
		} else {
			return false;
		}
	}

	public checkTransformationsValidity(query: any, validList: any[]): boolean {
		let returnVal = false;
		if (query.TRANSFORMATIONS.GROUP != null) {
			if (query.TRANSFORMATIONS.APPLY != null) {
				returnVal = true;
				query.TRANSFORMATIONS.GROUP.forEach((nm: any) => {
					if (!(validList.indexOf(nm) > -1)) {
						returnVal = false;
					}
				});
				let listofApplyKeys = Object.keys(query.TRANSFORMATIONS.APPLY[0]);
				let listofTotalKeys = query.TRANSFORMATIONS.GROUP.concat(listofApplyKeys);

				let keysMatch = true;
				listofTotalKeys.forEach((ke: any) => {
					if (!(query.OPTIONS.COLUMNS.indexOf(ke) > -1)) {
						keysMatch = false;
					}
				});
				returnVal = returnVal && keysMatch;
			}
		}
		return returnVal;
	}

	public checkWhereValidity(query: any, listOfAcceptableComparators: any[], validList: any[]): boolean {
		let returnVal = true;
		let firstChunk = query.WHERE;
		if (firstChunk == null || Array.isArray(firstChunk)) {
			return false;
		}
		let listOfComparators = Object.keys(firstChunk);
		let counter = 0;
		listOfComparators.forEach((ke: any) => {
			if (ke === "AND") {
				if (query.WHERE[ke] < 2) {
					returnVal = false;
				} else {
					for (let x of firstChunk.AND) {
						let tempPartAnd = this.checkWhereValidityHelper(x, listOfAcceptableComparators, validList);
						returnVal = (returnVal && tempPartAnd);
					}
				}
			}
			if (ke === "OR") {
				if (query.WHERE[ke] < 2) {
					returnVal = false;
				} else {
					for (let x of firstChunk.OR) {
						let tempPartOr = this.checkWhereValidityHelper(x,
							listOfAcceptableComparators, validList);
						returnVal = (returnVal && tempPartOr);
					}
				}
			}
			if (ke !== "AND" && ke !== "OR") {
				this.checkWhereShortner(ke, firstChunk);
				if (listOfAcceptableComparators.indexOf(ke) > -1) {
					if (Object.keys(firstChunk[ke]).length > 1) {
						throw new InsightError("Body more than one filter");
					}
					let tempVal = Object.keys(firstChunk[ke])[counter];
					if (!(validList.indexOf(tempVal) > -1)) {
						returnVal = false;
					}
				} else {
					returnVal = false;
				}
				counter++;
			}
		});
		return returnVal;
	}

	public checkWhereShortner(ke: any, firstChunk: any) {
		if (ke === "EQ" || ke === "LT" || ke === "GT") {
			if (Object.keys(firstChunk[ke]).includes(this.ID + "_dept" || this.ID + "_id" ||
				this.ID + "_instructor" || this.ID + "_title" || this.ID + "_uuid")) {
				throw new InsightError("invalid math key");
			}
		} else if (ke === "IS" || ke === "NOT") {
			if (Object.keys(firstChunk[ke]).includes(this.ID + "_avg" || this.ID + "_pass" ||
				this.ID + "_fail" || this.ID + "_audit" || this.ID + "_year")) {
				throw new InsightError("invalid string key");
			}
		}
	}


	public checkWhereValidityHelper(query: any, listOfAcceptableComparators: any[], validList: any[]): boolean {

		let listOfComparators = Object.keys(query);
		let counter = 0;
		let returnVal = true;
		listOfComparators.forEach((ke: any) => {
			if (ke === "AND") {
				for (let i of query.AND) {
					let tempPartAnd =  this.checkWhereValidityHelper(i,
						listOfAcceptableComparators, validList);
					returnVal = (returnVal && tempPartAnd);
				}
				return returnVal;
			}
			if (ke === "OR") {
				for(let i of query.OR) {
					let tempPartOr = this.checkWhereValidityHelper(i,
						listOfAcceptableComparators, validList);
					returnVal = (returnVal && tempPartOr);
				}
				return returnVal;
			}
			if (ke !== "AND" && ke !== "OR") {
				if (ke === "EQ" || ke === "LT" || ke === "GT") {
					if (Object.keys(query[ke]).includes(this.ID + "_dept" || this.ID + "_id" ||
						this.ID + "_instructor" || this.ID + "_title" || this.ID + "_uuid")) {
						throw new InsightError("invalid math key");
					}
				} else if (ke === "IS" || ke === "NOT") {
					if (Object.keys(query[ke]).includes(this.ID + "_avg" || this.ID + "_pass" ||
						this.ID + "_fail" || this.ID + "_audit" || this.ID + "_year")) {
						throw new InsightError("invalid string key");
					}
				}
				if (listOfAcceptableComparators.indexOf(ke) > -1) {
					if (Object.keys(query[ke]).length > 1) {
						throw new InsightError("Body more than one filter");
					}
					let tempVal = Object.keys(query[ke])[counter];
					// TODO remove id
					if (!(validList.indexOf(tempVal) > -1)) {
						returnVal = false;
					}
				} else {
					returnVal = false;
				}
				counter++;
			}
		});
		return returnVal;
	}

	public checkOptionsValidity(query: any, validList: any[], haveTransformations: boolean ): boolean {
		let insideFirstBrackets = query.OPTIONS;
		let listofColumnAndOrder = Object.keys(insideFirstBrackets);
		let returnBool = true;
		if (listofColumnAndOrder[0] !== "COLUMNS") {
			returnBool = false;
		} else {
			if (haveTransformations) { // if no transformations, need to check the columns are in valid list
				insideFirstBrackets.COLUMNS.forEach((nm: any) => {
					if (nm.split("_").length > 1) {
						if (!(validList.indexOf(nm) > -1)) {
							returnBool = false;
						}
					}
				});
			}
			if (insideFirstBrackets.ORDER != null) {
				if (insideFirstBrackets.ORDER.dir != null && insideFirstBrackets.ORDER.dir !== undefined) {
					if (!(insideFirstBrackets.ORDER.dir === "UP" || insideFirstBrackets.ORDER.dir === "DOWN")) {
						returnBool = false;
					}
					if (insideFirstBrackets.ORDER.keys != null) {
						insideFirstBrackets.ORDER.keys.forEach((key: any) => {
							if (insideFirstBrackets.COLUMNS.indexOf(key) < 0) {
								returnBool = false;
							}
						});
					}
				} else {
					if (insideFirstBrackets.COLUMNS.indexOf(insideFirstBrackets.ORDER) < 0) {
						returnBool = false;
					}
				}
			}
		}
		return returnBool;
	}
}

import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {Section} from "./Section";
import JSZip, {JSZipObject} from "jszip";
import * as fse from "fs-extra";
import {createFile} from "fs-extra";
import getPrototypeOf = Reflect.getPrototypeOf;


export default class QueryHandler {
	private validList: string[] = [];
	private listOfSorters = [];
	private dirOfSorters = "UP";

	constructor() {
		/* this.ids = [];
		this.datasets = [];   */
	}


	public disassembleQuery(query: any, itemsList: Section[], id: string): any[] {
		this.validList = this.disassembleQueryShortener(id);
		let firstChunk = query.WHERE;
		let tempList: any[] = [];
		if (firstChunk[0] == null) {
			tempList = itemsList;
		}
		Object.keys(firstChunk).forEach((ke: any) => {
			if (ke === "AND") {
				let firstResults = this.disassembleQueryHelper(firstChunk.AND[0], itemsList);
				let secondResults = this.disassembleQueryHelper(firstChunk.AND[1], itemsList);
				tempList = this.combineAdd(firstResults, secondResults);
				for (let x = 2; x < firstChunk[ke].length; x++) {
					let tempResults = this.disassembleQueryHelper(firstChunk.AND[x], itemsList);
					tempList = this.combineAdd(tempResults, tempList);
				}
			}
			if (ke === "OR") {
				let firstResults = this.disassembleQueryHelper(firstChunk.OR[0], itemsList);
				let secondResults = this.disassembleQueryHelper(firstChunk.OR[1], itemsList);
				tempList = this.combineOr(firstResults, secondResults);
				for (let x = 2; x < firstChunk[ke].length; x++) {
					let tempResults = this.disassembleQueryHelper(firstChunk.OR[x], itemsList);
					tempList = this.combineOr(tempResults, tempList);
				}
			}
			let obj = firstChunk[ke];
			// if (Object.keys(obj).length > 1) {
			// 	throw new InsightError("More than 1 filter");
			// }
			let filterFieldOriginal = Object.keys(obj)[0];
			let filterField = filterFieldOriginal.split("_")[1];
			let filterCriteria = obj[filterFieldOriginal];

			if (ke === "GT") {
				tempList = this.filterListMCOMPARE(itemsList, filterField, filterCriteria, "GT");
			}
			if (ke === "LT") {
				tempList = this.filterListMCOMPARE(itemsList, filterField, filterCriteria, "LT");
			}
			if (ke === "EQ") {
				tempList = this.filterListMCOMPARE(itemsList, filterField, filterCriteria, "EQ");
			}
			if (ke === "IS") {
				tempList = this.filterListSCOMPARE(itemsList, filterField, filterCriteria);
			}
			if (ke === "NOT") {
				tempList = this.filterListNEGATE(itemsList, this.disassembleQueryHelper(obj, itemsList));
			}
		});
		return tempList;
	}

	public disassembleQueryShortener(id: string) {
		return [id + "_dept", id + "_id", id + "_avg", id + "_instructor",
			id + "_title", id + "_pass", id + "_fail", id + "_audit", id + "_uuid",
			id + "_year", id + "_shortname", id + "_fullname", id + "_number", id + "_name",
			id + "_address", id + "_lon", id + "_lat", id + "_seats", id + "_type",
			id + "_furniture", id + "_href"];
	}

	public disassembleQueryHelper(query: any, sectionsList: any[]): any[] {
		let listOfComparators = Object.keys(query);
		let tempList: any[];
		tempList = [];
		listOfComparators.forEach((ke: any) => {
			if (ke === "AND") {
				let firstResults = this.disassembleQueryHelper(query.AND[0], sectionsList);
				let secondResults = this.disassembleQueryHelper(query.AND[1], sectionsList);
				/* for each section in each list, check if contained in other list.*/
				tempList = this.combineAdd(firstResults, secondResults);
				for (let x = 2; x < query.AND.length; x++) {
					let tempResults = this.disassembleQueryHelper(query.AND[x], sectionsList);
					tempList = this.combineAdd(tempResults, tempList);
				}
			}
			if (ke === "OR") {
				let firstResults = this.disassembleQueryHelper(query.OR[0], sectionsList);
				let secondResults = this.disassembleQueryHelper(query.OR[1], sectionsList);
				tempList = this.combineOr(firstResults, secondResults);

				for (let x = 2; x < query.OR.length; x++) {
					let tempResults = this.disassembleQueryHelper(query.OR[x], sectionsList);
					tempList = this.combineOr(tempResults, tempList);
				}
			}

			let obj = query[ke];
			let filterFieldOriginal = Object.keys(obj)[0];
			let filterField = filterFieldOriginal.split("_")[1];
			let filterCriteria = obj[filterFieldOriginal];


			if (ke === "GT") {
				tempList = this.filterListMCOMPARE(sectionsList, filterField, filterCriteria, "GT");
			}
			if (ke === "LT") {
				tempList = this.filterListMCOMPARE(sectionsList, filterField, filterCriteria, "LT");
			}
			if (ke === "EQ") {
				tempList = this.filterListMCOMPARE(sectionsList, filterField, filterCriteria, "EQ");
			}
			if (ke === "IS") {
				tempList = this.filterListSCOMPARE(sectionsList, filterField, filterCriteria);
			}
			if (ke === "NOT") {
				tempList = this.filterListNEGATE(sectionsList, this.disassembleQueryHelper(obj, sectionsList));
			}
		});
		return tempList;
	}

	private combineAdd(firstResults: any[], secondResults: any[]) {
		let listReturnable: any[];
		listReturnable = [];
		firstResults.forEach((sec: any) => {
			if (secondResults.indexOf(sec) > -1) {
				listReturnable.push(sec);
			}
		});

		return listReturnable;
	}

	private combineOr(firstResults: any[], secondResults: any[]) {
		let inFirstNotInSecond: any[] = [];
		firstResults.forEach((sec: any) => {
			if (!(secondResults.indexOf(sec) > -1)) {
				inFirstNotInSecond.push(sec);
			}
		});
		let listReturnable = secondResults.concat(inFirstNotInSecond);
		return listReturnable;
	}

	private filterListSCOMPARE(sectionsList: any[], critField: string, critString: string): Section[] {
		let returnableList: Section[] = [];

		sectionsList.forEach((sec: any) => {
			if (sec[critField] === critString) {
				returnableList.push(sec);
			}
		});
		return returnableList;
	}

	private filterListMCOMPARE(sectionsList: Section[], critField: string, critFilter: any, sign: string): Section[] {
		let returnableList: Section[];
		returnableList = [];

		if (sign === "GT") {
			sectionsList.forEach((sec: any) => {
				if (sec[critField] > critFilter) {
					returnableList.push(sec);
				}
			});
		}

		if (sign === "LT") {
			sectionsList.forEach((sec: any) => {
				if (sec[critField] < critFilter) {
					returnableList.push(sec);
				}
			});
		}

		if (sign === "EQ") {
			sectionsList.forEach((sec: any) => {
				if (sec[critField] === critFilter) {
					returnableList.push(sec);
				}
			});
		}

		return returnableList;
	}

	public filterListNEGATE(sectionsList: any[], returnedList: any[]): Section[] {
		let returnableList: any[] = [];
		sectionsList.forEach((sec: any) => {
			if (!(returnedList.indexOf(sec) > -1)) {
				returnableList.push(sec);
			}
		});
		return returnableList;
	}

	public orderResults(query: any, listofResults: any[]): Section[] {
		if (query.OPTIONS.ORDER == null) {
			return listofResults;
		}
		let fieldToSortOriginal = query.OPTIONS.ORDER;
		let fieldToSort = fieldToSortOriginal.split("_")[1];
		let returnList = listofResults.sort((a, b) => (a[fieldToSort] > b[fieldToSort] ? 1 : -1));


		return returnList;
	}

	/*	public sortHelper(fieldToSort average, id, xxx) {

			((a, b) => (a[fieldToSort] < b[fieldToSort] ? 1 : (a[fieldToSort] > b[fieldToSort]);
		}*/

	/*
		const newArrayWithoutId = updates.map(({ point, value }) => {
			return {
				point,
				value,
			}
		}*/

	/*	public filterColumns(query: any, listofResults: any[]) {
			let returnableArray: any[];
			let columnsNeeded: any;
			returnableArray = listofResults.map((obj) => {
				return query.OPTIONS.COLUMNS.values;
			});

		}
	}
	*/

	public filterColumns(query: any, listofResults: any[]): any[] {
		let returnableArray: any[] = [];
		let columnsNeeded: any[] = query.OPTIONS.COLUMNS;
		listofResults.forEach((sec: any) => {
			let tempObj: any = new Object();
			columnsNeeded.forEach((col: any) => {
				// console.log(this.validList);
				if (this.validList.indexOf(col) < 0) {
					let field = this.getFieldOfApply(query, col);
					tempObj[field] = sec[field.split("_")[1]];
				} else {
					tempObj[col] = sec[col.split("_")[1]];
				}
			});
			returnableArray.push(tempObj);
		});
		return returnableArray;
	}

	public getFieldOfApply(query: any, col: any): string {
		let count: number = 0;
		for (let i = 0; i < query.TRANSFORMATIONS.APPLY.length; i++) {
			if (Object.keys(query.TRANSFORMATIONS.APPLY[i])[0] === col) {
				count = i;
			}
		}

		let keyOfField = Object.keys(query.TRANSFORMATIONS.APPLY[count][col])[0];
		let returnedField = query.TRANSFORMATIONS.APPLY[count][col][keyOfField];
		return returnedField;
	}
}

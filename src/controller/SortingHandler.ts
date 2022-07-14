import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {Section} from "./Section";
import JSZip, {JSZipObject} from "jszip";
import * as fse from "fs-extra";
import {createFile} from "fs-extra";
import getPrototypeOf = Reflect.getPrototypeOf;


export default class SortingHandler {
	private validList: string[] = [];
	private listOfSorters = [];
	private dirOfSorters = "UP";

	constructor() {
		/* this.ids = [];
		this.datasets = [];   */
	}
/*	public orderResults(query: any, listofResults: any[]): Section[] {
		if (query.OPTIONS.ORDER == null) {
			return listofResults;
		}
		let fieldToSortOriginal = query.OPTIONS.ORDER;
		let fieldToSort = fieldToSortOriginal.split("_")[1];
		let returnList = listofResults.sort((a, b) => (a[fieldToSort] > b[fieldToSort] ? 1 : -1));


		return returnList;
	}*/

	public sortResults(results: any[], query: any): any[] {
		// 1. no options.order
		// 2. options.order sort by one field, direction up
		// 3. options.order sort by direction, and multiple fields.
		if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined) {
			if (query.OPTIONS.ORDER.dir === undefined || query.OPTIONS.ORDER.dir == null) {
				results.sort((a, b) => (a[query.OPTIONS.ORDER] > b[query.OPTIONS.ORDER] ?
					1 : -1));
			} else {
				this.listOfSorters = query.OPTIONS.ORDER.keys;
				this.dirOfSorters = query.OPTIONS.ORDER.dir;
				results.sort((a,b) => {
					return this.sortResultsHelper(a, b, 0);
				});
			}
		}
		return results;
	}

	public sortResultsHelper(a: any, b: any, sortCounter: number ): any{
		let fieldToSortBy: string = this.listOfSorters[sortCounter];

		if (this.dirOfSorters === "UP") {
			if (a[fieldToSortBy] > b[fieldToSortBy]) {
				return 1;
			}
			if (a[fieldToSortBy] < b[fieldToSortBy]) {
				return -1;
			} else {
				if (this.listOfSorters.length - 1 > sortCounter) {
					sortCounter++;
					return this.sortResultsHelper(a,b, sortCounter);
				} else {
					return 0;
				}
			}
		}
		if (this.dirOfSorters === "DOWN")  {
			if (a[fieldToSortBy] < b[fieldToSortBy]) {
				return 1;
			}
			if (a[fieldToSortBy] > b[fieldToSortBy]) {
				return -1;
			} else {
				if (this.listOfSorters.length - 1 > sortCounter) {
					sortCounter++;
					return this.sortResultsHelper(a,b, sortCounter);
				} else {
					return 0;
				}
			}
		}
		return 0;

	}

	public helperGetRightValidList(query: any): string {
		let validCourse = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "year"];
		let validRooms = ["shortname", "fullname", "number", "name", "address", "lon", "lat", "seats",
			"type", "furniture", "href"];
		let whichList = "false";
		if (query.OPTIONS == null || query.OPTIONS === undefined) {
			return whichList;
		}
		if (!query.OPTIONS.COLUMNS) {
			return whichList;
		}
		let returnVal = "";
		let columnsList = query.OPTIONS.COLUMNS;
		if (columnsList.length < 1) {
			return whichList;
		}
		let firstColumn = columnsList[0].split("_");
		if (firstColumn.length > 1) {
			returnVal = firstColumn[1];
			if (validCourse.indexOf(returnVal) > -1) {
				whichList = "course";
			}
			if (validRooms.indexOf(returnVal) > -1) {
				whichList = "rooms";
			}
		} else {
			let keepGoing = true;
			let counter = 1;
			while (keepGoing) {
				let column = columnsList[counter].split("_");
				if (column.length > 1) {
					if (validCourse.indexOf(column[1]) > -1) {
						whichList = "course";
						keepGoing = false;
					}
					if (validRooms.indexOf(column[1]) > -1) {
						whichList = "rooms";
						keepGoing = false;
					}
				}
				if (columnsList.length === counter - 1) {
					keepGoing = false;
				}
				counter++;
			}
		}
		return whichList;
	}

	public helperGetActualValidList(id: string, whichValidList: string, query: any) {
		let validListCourse = [id + "_dept", id + "_id", id + "_avg", id + "_instructor",
			id + "_title", id + "_pass", id + "_fail", id + "_audit", id + "_uuid", id + "_year"];
		let validListRooms = [id + "_shortname", id + "_fullname", id + "_number", id + "_name",
			id + "_address", id + "_lon", id + "_lat", id + "_seats", id + "_type", id + "_furniture", id + "_href"];
		let validCourse = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "year"];
		let validRooms = ["shortname", "fullname", "number", "name", "address", "lon", "lat", "seats",
			"type", "furniture", "href"];
		let returnList: any[] = [];
		if (query.OPTIONS == null || query.OPTIONS === undefined) {
			return returnList;
		}
		if (query.OPTIONS.COLUMNS == null || query.OPTIONS.COLUMNS === undefined) {
			return returnList;
		}
		let listOfColumns = query.OPTIONS.COLUMNS;
		if (whichValidList === "course") {
			returnList = validListCourse;
			listOfColumns.forEach((col: any) => {
				let column = col.split("_");
				if (column.length > 1) {
					if (validCourse.indexOf(column[1]) < 0) {
						returnList = [];
					}
				}
			});
		}
		if (whichValidList === "rooms") {
			returnList = validListRooms;
			listOfColumns.forEach((col: any) => {
				let column = col.split("_");
				if (column.length > 1) {
					if (validRooms.indexOf(column[1]) < 0) {
						returnList = [];
					}
				}
			});
		}
		return returnList;
	}
}

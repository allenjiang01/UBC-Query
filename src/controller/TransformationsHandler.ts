import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {Section} from "./Section";
import JSZip, {JSZipObject} from "jszip";
import * as fse from "fs-extra";
import {createFile} from "fs-extra";
import getPrototypeOf = Reflect.getPrototypeOf;
import Decimal from "decimal.js";


export default class QueryHandler {
	public ID: string = "";

	private validList = [this.ID + "_dept", this.ID + "_id", this.ID + "_avg", this.ID + "_instructor",
		this.ID + "_title", this.ID + "_pass", this.ID + "_fail", this.ID + "_audit", this.ID + "_uuid",
		this.ID + "_year", this.ID + "_shortname", this.ID + "_fullname", this.ID + "_number", this.ID + "_name",
		this.ID + "_address", this.ID + "_lon", this.ID + "_lat", this.ID + "_seats", this.ID + "_type",
		this.ID + "_furniture", this.ID + "_href"];

	constructor() {
		/* this.ids = [];
		this.datasets = [];   */
	}

	public groupResults(query: any, listofResults: any[], id: string): any[] {
		this.ID = id;
		let holder: any = {};
		let grouper: string = "";
		if (query.TRANSFORMATIONS.GROUP.length === 1) {
			grouper = query.TRANSFORMATIONS.GROUP[0];
			let grouperUsableByQuery = grouper.split("_")[1];
			listofResults.forEach((res: any) => {
				let grouperActualVal = res[grouperUsableByQuery];
				holder = this.helperGrouper(holder, res, grouperActualVal);
			});
		} else {
			query.TRANSFORMATIONS.GROUP.forEach((str: string) => {
				grouper = grouper + "_" + str;
			});
			listofResults.forEach((res: any) => {
				let grouperActualVal = "";
				query.TRANSFORMATIONS.GROUP.forEach((str: string) => {
					grouperActualVal = grouperActualVal + "_" + res[str];
				});
				holder = this.helperGrouper(holder, res, grouperActualVal);
			});
		}
		holder = this.applyMultipleResults(query, holder, grouper);
		return holder;
	}

	public helperGrouper(holder: any, res: any, grouperActualVal: string): any {
		if (Object.keys(holder).indexOf(grouperActualVal) < 0) {
			let tempList = [];
			tempList.push(res);
			holder[grouperActualVal] = tempList;
		} else {
			let tempHolderList = holder[grouperActualVal];
			tempHolderList.push(res);
			holder[grouperActualVal] = tempHolderList;
		}
		return holder;
	}

/*	public applyResults(query: any, holder: any, grouper: string): any[]{

		let nameOfApply = Object.keys(query.TRANSFORMATIONS.APPLY[0])[0];
		let command = Object.keys(query.TRANSFORMATIONS.APPLY[0][nameOfApply])[0];
		let columnApply = query.TRANSFORMATIONS.APPLY[0][nameOfApply][command].split("_")[1];
		let returnableResults: any[] = [];

		if (command === "SUM") {
			let listOfKeys = Object.keys(holder);
			listOfKeys.forEach((groupKey: any) => {
				let listOfVals: any[] = holder[groupKey];
				let sumVal: number = 0;
				listOfVals.forEach((item: any) => {
					let valAdd: number = item[columnApply];
					sumVal = +sumVal + +valAdd;
				});
				let tempObj: any = {};
				tempObj[grouper] = groupKey;
				tempObj[nameOfApply] = sumVal;
				returnableResults.push(tempObj);
			});
		}


		return returnableResults;
	}*/

	public applyMultipleResults(query: any, holder: any, grouper: string): any[]{

		let returnableResults: any[] = [];

		let listOfKeys = Object.keys(holder); // each group within holder: eg, HA: x, y, z
		listOfKeys.forEach((groupKey: any) => {
			let listOfVals: any[] = holder[groupKey];
			let tempObj: any = {};
			tempObj[grouper] = groupKey;

			let listOfApplyKeys = query.TRANSFORMATIONS.APPLY;
			listOfApplyKeys.forEach((applyKey: any) => {
				let nameOfApply = Object.keys(applyKey)[0];
				let command = Object.keys(applyKey[nameOfApply])[0];
				let columnApply = applyKey[nameOfApply][command].split("_")[1];
				let appliedVal: number = 0;

				if (!(command === "AVG" || command === "COUNT")) {
					appliedVal = this.getAppliedValForMost(listOfVals, command, columnApply);
					if (command === "SUM") {
						appliedVal = Number(appliedVal.toFixed(2));
					}
					tempObj[nameOfApply] = appliedVal;
				}

				if (command === "AVG") {
					let avg = this.getAppliedValForAVG(listOfVals, columnApply);
					let res = Number(avg.toFixed(2));
					tempObj[nameOfApply] = res;
				}
				if (command === "COUNT") {
					let count = this.getAppliedValForCOUNT(listOfVals, columnApply);
					tempObj[nameOfApply] = count;
				}

			});
			returnableResults.push(tempObj);
		});
		// return returnableResults;
		// let sortedResults = returnableResults.sort((a,b) => (a[grouper] > b[grouper] ? 1 : -1));
		return returnableResults;
	}

	public getAppliedValForCOUNT(listOfVals: any[], columnApply: string): number {
		let listHolderUniqueness: any[] = [];
		listOfVals.forEach((val: any) => {
			if (listHolderUniqueness.indexOf(val[columnApply]) < 0) {
				listHolderUniqueness.push(val[columnApply]);
			}
		});
		return listHolderUniqueness.length;
	}

	public getAppliedValForMost(listOfVals: any[], command: string, columnApply: string): number {
		let appliedVal: number = 0;
		let counterForMin: number = 0;

		listOfVals.forEach((item: any) => {
			let valAddOn: number = item[columnApply];

			if (command === "SUM") {
				appliedVal = +appliedVal + +valAddOn;
			}

			if (command === "MAX") {
				if (valAddOn > appliedVal) {
					appliedVal = valAddOn;
				}
			}

			if (command === "MIN") {
				if (counterForMin === 0) {
					appliedVal = valAddOn;
					counterForMin = -1;
				} else {
					if (valAddOn < appliedVal) {
						appliedVal = valAddOn;
					}
				}
			}
		});

		return appliedVal;
	}

	public getAppliedValForAVG(listOfVals: any[], columnApply: string): number {
		let decAppliedVal: Decimal = new Decimal(0);
		let counterForAvg: number = 0;

		listOfVals.forEach((item: any) => {
			let valAddOn: number = item[columnApply];
			let decValAddOn = new Decimal(valAddOn);
			decAppliedVal = Decimal.add(decValAddOn, decAppliedVal);
			counterForAvg++;
		});
		let avg = decAppliedVal.toNumber() / counterForAvg;
		return avg;
	}


}

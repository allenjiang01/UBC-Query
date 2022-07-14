import {Room} from "./Room";
import JSZip from "jszip";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as parse5 from "parse5";
import {Building} from "./Building";
import * as http from "http";

export default class RoomsManager {
	public rooms: Room[];
	public dataset: InsightDataset;
	public buildings: Building[];

	constructor() {
		this.rooms = [];
		let id = "rooms";
		let kind = InsightDatasetKind.Rooms;
		let numRows = 3;
		this.dataset = {id, kind, numRows};
		this.buildings = [];
	}

	public getBuildingContent(id: string, unzip: JSZip) {
		return new Promise((resolve, reject) => {
			try {
				if (unzip.file("rooms/index.htm") == null) {
					return reject(new InsightError());
				}
				let promise = unzip.file("rooms/index.htm")?.async("string").then(async (html: string) => {
					let document = parse5.parse(html);
					let body = this.getTBody(document);
					if (body == null) {
						throw new InsightError();
					}
					for (let childNode of body.childNodes) {
						if (childNode.nodeName === "tr") {
							let buildingCode: string = this.getBuildingData(childNode.childNodes[3]);
							let buildingName: string = this.getBuildingData2(childNode.childNodes[5]);
							let buildingAddress: string = this.getBuildingData(childNode.childNodes[7]);
							// https://stackoverflow.com/questions/3794919/replace-all-spaces-in-a-string-with
							let url: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team185/"
								+ buildingAddress.replace(/ /g, "%20");
							try {
								let geoData: number[] = await this.getGeoData(url);
								let lat: number = geoData[0];
								let lon: number = geoData[1];
								let building: Building =
									{buildingCode, buildingName, buildingAddress, lat, lon};
								this.buildings.push(building);
							} catch (e) {
								continue;
							}
						}
					}
					return resolve(this.getRoomContent(id, unzip));
				});
			} catch (e: any) {
				return reject(new InsightError());
			}
		});
	}

	// DFS
	public getTBody(doc: any): parse5.Document | null {
		if ((doc.childNodes == null)) {
			return null;
		}
		if (doc.nodeName === "tbody") {
			return doc;
		}
		for (let childNode of doc.childNodes) {
			let body = this.getTBody(childNode);
			if (body !== null) {
				return body;
			}
		}
		return null;
	}

	public getBuildingData2(td: any): string {
		return td.childNodes[1].childNodes[0].value.trim();
	}

	public getBuildingData(td: any): string {
		if (td.nodeName === "#text" && td.parentNode.childNodes.length === 1) {
			return td.value.trim();
		}
		if ((td.childNodes == null)) {
			return "";
		}
		for (let childNode of td.childNodes) {
			let result = this.getBuildingData(childNode);
			if (result !== "" && childNode.nodeName === "#text" && childNode.parentNode.childNodes.length === 1) {
				return childNode.value.trim();
			}
		}
		return "";
	}

	public getGeoData(url: string): Promise<number[]> {
		return new Promise<number[]>((resolve, reject) => {
			try {
				http.get(url, (result: any) => {
					let data: any = "";
					result.on("data", (returned_data: any) => {
						data += returned_data;
					});
					result.on("end", (r: any) => {
						let geo = JSON.parse(data);
						let geoData: number[] = [geo.lat, geo.lon];
						return resolve(geoData);
					});
				});
			} catch (e: any) {
				return new Error("error in geo");
			}
		});
	}


	public getRoomContent(id: string, unzip: JSZip) {
		let promises: any[] = [];
		return new Promise<any[]>((resolve, reject) => {
			try {
				let numRows: number = 0;
				for (let building of this.buildings) {
					let path = "rooms/campus/discover/buildings-and-classrooms/" + building.buildingCode;
					if (unzip.file(path) === undefined || unzip.file(path) === null) {
						return reject(new InsightError());
					}
					promises.push(unzip.file(path)?.async("string").then((html: string) => {
						let document = parse5.parse(html);
						let body = this.getTBody(document);
						if (body !== null) {
							for (let child of body.childNodes) {
								if (child.nodeName === "tr") {
									let fullname: string = building.buildingName;
									let shortname: string = building.buildingCode;
									let number: string = this.getBuildingData2(child.childNodes[1]);
									let name: string = shortname + " " + number;
									let address: string = building.buildingAddress;
									let lat: number = building.lat;
									let lon: number = building.lon;
									let seats: number = this.getRoomData(child.childNodes[3]);
									let type: string = this.getRoomData(child.childNodes[7]);
									let furniture: string = this.getRoomData(child.childNodes[5]);
									let url: string =
										"http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/";
									let href: string = url + shortname + "-" + number;
									const room = {
										fullname, shortname, number, name, address,
										lat, lon, seats, type, furniture, href
									};
									this.rooms.push(room);
									numRows++;
								}
							}
						}
					}));
				}
				return Promise.all(promises).then((result: any) => {
					this.dataset = {id, kind: InsightDatasetKind.Rooms, numRows: numRows};
					return resolve(this.rooms);
				});
			} catch (e: any) {
				return reject(new InsightError());
			}
		});
	}

	public getRoomData(td: parse5.ChildNode): any {
		return this.getBuildingData(td);
	}
}

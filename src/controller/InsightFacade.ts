import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	ResultTooLargeError,
	NotFoundError
} from "./IInsightFacade";
import {Section} from "./Section";
import DatasetManager from "./DatasetManager";
import ValidationHandler from "./ValidationHandler";
import QueryHandler from "./QueryHandler";
import TransformationsHandler from "./TransformationsHandler";
import SortingHandler from "./SortingHandler";

/*
* This is the main programmatic entry point for the project.
* Method documentation is in IInsightFacade
*
*/
export default class InsightFacade implements IInsightFacade {

	private datasetManager: DatasetManager;
	private validationHandler: ValidationHandler;
	private queryHandler: QueryHandler;
	private transformationHandler: TransformationsHandler;
	private sortingHandler: SortingHandler;

	constructor() {
		console.trace("InsightFacadeImpl::init()");
		this.datasetManager = new DatasetManager();
		this.validationHandler = new ValidationHandler();
		this.queryHandler = new QueryHandler();
		this.transformationHandler = new TransformationsHandler();
		this.sortingHandler = new SortingHandler();
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			return this.datasetManager.readNewDataset(id, content, kind).then((str: string[]) => {
				return resolve(str);
			}).catch((err) => {
				return reject(err);
			});
		});
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			return this.datasetManager.removeDataset(id).then((str: string) => {
				return resolve(str);
			}).catch((err) => {
				return reject(err);
			});
		});
	}


	/**
	 * Perform a query on insightUBC.
	 *
	 * @param query  The query to be performed.
	 *
	 * If a query is incorrectly formatted, references a dataset not added (in memory or on disk),
	 * or references multiple datasets, it should be rejected.
	 *
	 * @return Promise <any[]>
	 *
	 * The promise should fulfill with an array of results.
	 * The promise should reject with a ResultTooLargeError (if the query returns too many results)
	 * or an InsightError (for any other source of failure) describing the error.
	 */
	public performQuery(query: any): Promise<any[]> {
		return new Promise<any>((resolve, reject) => {
			let finalListResults: any[] = [];
			let id: string = this.validationHandler.getID(query);
			let whichValidList = this.sortingHandler.helperGetRightValidList(query);
			let validList: any[] = this.sortingHandler.helperGetActualValidList(id, whichValidList, query);
			try {
				if (this.validationHandler.checkValidity(query, id, validList)) {
					/* if (query.WHERE[0] == null) {
						return reject(new ResultTooLargeError());
					}  */
					let listFromDataset = this.datasetManager.getItemsList(id);
					if (listFromDataset.length === 0) {
						return reject(new InsightError ("no dataset added"));
					}
					let listResults = this.queryHandler.disassembleQuery(
						query, listFromDataset, id);
					finalListResults = listResults;
					if (query.TRANSFORMATIONS != null) {
						let transformedListResults = this.transformationHandler.groupResults(query, listResults, id);
						finalListResults = transformedListResults;
					} else {
						finalListResults = this.queryHandler.filterColumns(query, finalListResults);
					}
					if (finalListResults.length > 5000) {
						return reject(new ResultTooLargeError("ResultTooLargeError"));
					}
					let finalSortedListResults = this.sortingHandler.sortResults(finalListResults, query);
					finalListResults = finalSortedListResults;
				} else {
					return reject(new InsightError("InsightError"));
				}
				return resolve(finalListResults);
			} catch (err: any) {
				return reject(new InsightError(err));
			}
		});
	}


	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.datasetManager.listDatasets());
	}
}

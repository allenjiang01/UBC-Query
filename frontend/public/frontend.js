

document.getElementById("click-me-button").addEventListener("click", handleClickMe);
document.getElementById("compare-courses-button").addEventListener("click", handleCompare);
document.getElementById("find-prof-button").addEventListener("click", handleFind);


async function handleFind() {
	let course = document.getElementById("course").value;
	let dept = course.substring(0,4);
	let id = course.substring(4);

	let query =
		{
			WHERE: {
				AND: [
					{
						IS: {
							"courses_id": id
						}
					},
					{
						IS: {
							"courses_dept": dept
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"courses_instructor"
				],
				ORDER: "courses_instructor"
			}
		}

	const options = {
		method: "POST",
		body: JSON.stringify(query),
		headers: {
			"Content-Type": "application/json",
		}
	};


	const response = await fetch("/query", options);
	const json = await response.json();
	if(!response.ok) {
		throw new Error(json.error);
	} else {
		console.log(json);
	}

	const result = json.result;
	let prof1 = "";
	for(let object of result) {
		if (object.courses_instructor !== "") {
			prof1 = "This course was last taught by: " + object.courses_instructor;
			break;
		}
	}
	if (prof1 === "") {
		prof1 = "This course does not have previous professors!"
	}
	document.getElementById("prof").innerText = prof1;
}

function handleClickMe() {
		const datasetZipElement = document.getElementById("fileUpload");
	fetch("/dataset/courses/courses", {
		method: "PUT",
		body: datasetZipElement.files[0],
		headers: {
			"Content-Type": "application/x-zip-compressed",
		}
	}).then((res) => {
		return res.json();
	}).then((json) => {
		console.log(json);
		alert("file added");
	})
}

async function handleCompare() {
	let course1 = document.getElementById("course1").value;
	let dept1 = course1.substring(0, 4);
	let id1 = course1.substring(4);
	let course2 = document.getElementById("course2").value;
	let dept2 = course2.substring(0, 4);
	let id2 = course2.substring(4);
	// alert(id1);
	// alert(dept1);


	let query1 =
		{
			WHERE: {
				AND: [
					{
						IS: {
							"courses_id": id1
						}
					},
					{
						IS: {
							"courses_dept": dept1
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"courses_avg"
				],
				ORDER: "courses_avg"
			}
		}


	let query2 =
		{
			WHERE: {
				AND: [
					{
						IS: {
							"courses_id": id2
						}
					},
					{
						IS: {
							"courses_dept": dept2
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"courses_avg"
				],
				ORDER: "courses_avg"
			}
		}

	const options1 = {
		method: "POST",
		body: JSON.stringify(query1),
		headers: {
			"Content-Type": "application/json",
		}
	};

	const options2 = {
		method: "POST",
		body: JSON.stringify(query2),
		headers: {
			"Content-Type": "application/json",
		}
	};


	const response1 = await fetch("/query", options1);
	const json1 = await response1.json();
	if (!response1.ok) {
		throw new Error(json1.error);
	} else {
		console.log(json1);
	}

	const response2 = await fetch("/query", options2);
	const json2 = await response2.json();
	if (!response2.ok) {
		throw new Error(json2.error);
	} else {
		console.log(json2);
	}

	const result1 = json1.result;
	const result2 = json2.result;
	if (result1.length === 0) {
		document.getElementById("avgResult").innerText = "The id " + course1 + " does not exist!";
	} else if (result2.length === 0) {
		document.getElementById("avgResult").innerText = "The id " + course2 + " does not exist!";
	} else {
		let avg1 = 0;
		let avg2 = 0;
		for (let object of result1) {
			avg1 = avg1 + object.courses_avg;
		}
		for (let object of result2) {
			avg2 = avg2 + object.courses_avg;
		}
		avg1 = Math.round(avg1 / result1.length);
		avg2 = Math.round(avg2 / result2.length);
		let finalResult = "";
		if (avg1 > avg2) {
			finalResult = course1 + " has an average of " + avg1.toString() + " which is higher than " + course2 +
				"’s average of " + avg2.toString();
		} else if (avg1 < avg2) {
			finalResult = course2 + " has an average of " + avg2.toString() + " which is higher than " + course1 +
				"’s average of " + avg1.toString();
		} else {
			finalResult = course1 + " has an average of " + avg1.toString() + " which is equal to " + course2 +
				"’s average of " + avg2.toString();
		}
		document.getElementById("avgResult").innerText = finalResult;
	}
}


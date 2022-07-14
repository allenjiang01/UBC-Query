# CPSC 310 Project Repository

## Description
UBC is a big place, and involves a large number of people doing a variety of tasks. The goal of this project is to provide a way to perform some of the tasks required to run the university and to enable effective querying of the metadata from around campus. This will involve working with courses, prerequisites, past course averages, room scheduling, and timetable creation.

This will be a full stack web development project split into four sprints. The first three sprints are server-side development using Node. The fourth sprint is client-side development.

Development will be done with TypeScript and the packages and libraries are strictly limited (for the first three sprints).

### C0
Unit tests for the four methods of the InsightFacade class. These tests will form the basis of my personal test suite for the remainder of the project.

### C1
The goal of the checkpoint is to build the backend to reply to query about the dataset. The dataset must be manually added and the server must:
- Check the validity of the dataset
- Read and parse the dataset

EXAMPLE QUERY: 
{

    "WHERE":{

       "GT":{

          "courses_avg":97

       }

    },

    "OPTIONS":{

       "COLUMNS":[

          "courses_dept",

          "courses_avg"

       ],

       "ORDER":"courses_avg"

    }

} 
### C2
Project Sprint 1 (C1) built a query engine to answer queries about UBC course sections. C2 will extend the C1 solution by adding another type of input data (rooms) and extending the query language (adding result computation). The input data will now include data about the physical spaces where classes are held on campus.

This data has been obtained from the UBC Building and classrooms listing (although a few years ago). The data is provided as a zip file: inside of the zip you will find index.htm which specifies each building on campus. The links in the index.htm link to files also in the zip containing details about each building and its rooms in HTML format.

### C3
The existing InsightFacade will be adpated to also be accessed using REST endpoints. The goal of this sprint will be to build a website using HTML and plain JavaScript which will send REST commands to your server. 

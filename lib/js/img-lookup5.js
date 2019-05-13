/**
* Author: Brian Caicco
* ============================================================================================
* Date Created: May 13, 2019
* ============================================================================================
* Description: 
* After taking a csv file, this program go through the csv file 
* and checks to see if there are imageIds within these columns. This is done 
* with PapaParse which parsing the rows into objects. Then we test if the values
* in columns passed regex test (means these are valid imageIds) and then also 
* updates the the column with specified headers with the image data (width and height).
* After completion, it creates an updated csv file to the users desktop with the updated data.
* ============================================================================================
*/

var baseUrl = "https://www.staples-3p.com/s7/is/image/Staples/"; //base url which is later concatenated with imageIds and the suffix
var suffix = "_sc7?"; // when concatenated, the suffix allows us to look at the atual image size

$(document).ready(function () {

    // Autostart Upload
    if (isFileAPIAvailable()) {
        $('#files').bind('change', handleDialog);
    }
});

function createCsv(rows) {
    console.log(rows); //prints the objects with the updated information (testing purposes, can be removed)
    var csv = Papa.unparse(rows); // unparses the objects to a csv format 
    console.log(csv); //prints the updated csv to the console (testing purposes, can be removed)

    document.getElementById("complete-message").style.display = "block";
    document.getElementById("restart-btn").innerHTML = "<a href='#' onclick='location.reload();' class='btn btn-primary upload-field mb-5' id='startover-btn'>Start Over</a>";
    document.getElementById("spinner").style.visibility = "hidden";

    var csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); //creates a new file type with the csv updated data
    var csvURL = window.URL.createObjectURL(csvData); //creates the object of the new file type
    var testLink = document.createElement('a'); //appends the new element 
    //creates the connection where it sets the attribute of the file and downloads to dekstop
    testLink.setAttribute('test', 'test.csv');
    testLink.href = csvURL; 
    testLink.click();

}

//this function is used to update columns
function updateImageDimension(columnName, dimension) {
    //if column names pass the regex test, then those cells are updated
    
    if ((/^Image[\d+$]+_Size/).test(columnName)) return `${dimension.width}x${dimension.height}`;
    if ((/^Image[\d+$]+_Pixel1/).test(columnName)) return dimension.width;
    if ((/^Image[\d+$]+_Pixel2/).test(columnName)) return dimension.height;
}

var cache = {}; //creates a object used to store previously scanned images 

//function that gets the image and creates a url and returns the image width and height
function getMeta(imageId)
{
    if (cache[imageId]) console.log('cache ok') //if the image id already exists, prints cache ok to console (testing purposes, can be removed)
    document.getElementById("spinner").style.visibility = "visible";

    // Checking if we have previously processed this image
    if (cache[imageId]) return cache[imageId]; //if the image id already exists, return the data for that imageId
    const url = baseUrl + imageId + suffix; //creates the url for the image we want to load and recieve its dimensions
    
    //sets a new object with keys that have empty pair value (to be added later)
    const result = {
        width: '',
        height: ''
    }

    var img = new Image(); //creates new image object
    img.src = url; //gets the image source via url

    window.pendingLoads++; //adds the number of loads for imageIds

    //setTimeout excecutes the funtion after the load 
    setTimeout(function () {
        img.addEventListener("load", function () { //loads the image via addEventListener
            result.width = this.naturalWidth.toString(); //sets the width value in the object (object --> result)
            result.height = this.naturalHeight.toString(); //sets the height value in the object (object --> result)
            // When last image is loaded
            window.pendingLoads--;
            if (!window.pendingLoads) {
                window.onLoadComplete();
            }
        });
    })
    // Add the result of processing this image to the cache
    cache[imageId] = result;
    return result;
}

function handleDialog(event) {
    var files = event.target.files;
    var file = files[0];
    document.getElementById("spinner").style.display = "block";
    Papa.parse(file, {
        download: true,
        header: true,
        complete: function (results) {
            document.getElementById("title").style.display = "none";
            document.getElementById("header-example").style.display = "none";
            document.getElementById("upload-btn").style.display = "none";
            document.getElementById("instructions").style.display = "none";
            
            let rows = results['data']; //lets rows equal the new objects created by PapaParse
            window.pendingLoads = 0; //sets the number of image loads to 0
            
            //go through each row, checks for any empty columns 
            rows.forEach((row) => {                              
                const emptyColumns = [];
                for (let column in row) {
                    if (!row[column]) emptyColumns.push(column);
                }
                
                //goes through the columns and tests if values in the column past the regex test  
                emptyColumns.forEach((column) => {
                    const match = column.match(/^(Image\d*).*/);
                    if (!match) return;
                    const imageId = row[match[1]];
                    if (!imageId) return;
                    const imgDim = getMeta(imageId);
                });
            });
            
            //executes when the loads are complete, if row not in column- push to empty columns array
            window.onLoadComplete = function () { 
                rows.forEach((row) => {
                    const emptyColumns = [];
                    for (let column in row) {
                        if (!row[column]) emptyColumns.push(column);
                    }
                    
                    //calls to update the columns with image data if the value passes the regex test (aka the imageIds)
                    emptyColumns.forEach((column) => {
                        const match = column.match(/^(Image\d*).*/);
                        if (!match) return;
                        const imageId = row[match[1]];
                        if (!imageId) return;
                        const imgDim = getMeta(imageId);
                        row[column] = updateImageDimension(column, imgDim);
                    });
                });
                createCsv(rows); //calls the function that creates the final output (csv) --> also prints out all the updated data
            };
        }
    });
}

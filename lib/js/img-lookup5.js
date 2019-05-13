var baseUrl = "https://www.staples-3p.com/s7/is/image/Staples/";
var suffix = "_sc7?";
var count = 0;
var w;
var h;
let url = "";

$(document).ready(function () {

    // Autostart Upload
    if (isFileAPIAvailable()) {
        $('#files').bind('change', handleDialog);
    }


});

function createCsv(rows) {
    console.log(rows);
    var csv = Papa.unparse(rows);
    console.log(csv);

    document.getElementById("complete-message").style.display = "block";
    document.getElementById("restart-btn").innerHTML = "<a href='#' onclick='location.reload();' class='btn btn-primary upload-field mb-5' id='startover-btn'>Start Over</a>";
    document.getElementById("spinner").style.visibility = "hidden";


    var csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var csvURL = window.URL.createObjectURL(csvData);
    var testLink = document.createElement('a');
    testLink.href = csvURL;
    testLink.setAttribute('test', 'test.csv');
    testLink.click();

}

function updateImageDimension(columnName, dimension) {
    if ((/^Image[\d+$]+_Size/).test(columnName)) return `${dimension.width}x${dimension.height}`;
    if ((/^Image[\d+$]+_Pixel1/).test(columnName)) return dimension.width;
    if ((/^Image[\d+$]+_Pixel2/).test(columnName)) return dimension.height;
}

var cache = {};
function getMeta(imageId)//, callback) 
{
    if (cache[imageId]) console.log('cache ok')
    document.getElementById("spinner").style.visibility = "visible";

    // Checking if we have previously processed this image
    if (cache[imageId]) return cache[imageId];
    const url = baseUrl + imageId + suffix;
    const result = {
        width: '',
        height: ''
    }

    var img = new Image();
    img.src = url;

    window.pendingLoads++;

    setTimeout(function () {
        img.addEventListener("load", function () {
            result.width = this.naturalWidth.toString();
            result.height = this.naturalHeight.toString();
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
            let rows = results['data'];
            window.pendingLoads = 0;
            rows.forEach((row) => {
                const emptyColumns = [];
                for (let column in row) {
                    if (!row[column]) emptyColumns.push(column);
                }
                emptyColumns.forEach((column) => {
                    const match = column.match(/^(Image\d*).*/);
                    if (!match) return;
                    const imageId = row[match[1]];
                    if (!imageId) return;
                    const imgDim = getMeta(imageId);
                });
            });
            window.onLoadComplete = function () {
                rows.forEach((row) => {
                    const emptyColumns = [];
                    for (let column in row) {
                        if (!row[column]) emptyColumns.push(column);
                    }
                    emptyColumns.forEach((column) => {
                        const match = column.match(/^(Image\d*).*/);
                        if (!match) return;
                        const imageId = row[match[1]];
                        if (!imageId) return;
                        const imgDim = getMeta(imageId);
                        row[column] = updateImageDimension(column, imgDim);
                    });
                });
                createCsv(rows);
            };
        }
    });
}
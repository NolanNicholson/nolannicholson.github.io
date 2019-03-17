//
//Loads a string in Wavefront .OBJ format and returns the model.
//
function loadOBJFromString(string) {

    //Pre-format
    var lines = string.split("\n");
    return lines;
}

//
//Fetches a string by ID from an iframe.
//Requires that the iframe be fully loaded first!
//
function getStringFromIFrameID(ID) {
    var frame = document.getElementById(ID);
    var string = frame.contentWindow.document.body.childNodes[0].innerHTML;
    return string;
}

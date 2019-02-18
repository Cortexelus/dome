// This code was written functionally at first
// But should be refactored into a singleton class later

var _data, _dataset_directory;
var audio_player = document.querySelector("audio");
var _loaded = false;
var _audio_has_begun = false;

// loads the dataset contained within the given direcotry
function domeload_directory(directory){
  // directory should contains a data.json
  let json_file = directory + "/data.json"
  $.getJSON(json_file).fail(function() {
    console.error( "error loading JSON" );
    // if data already loaded some other way, then load that
    if(_data){
      domeload(directory, _data)
    }
  }).done(function(data){
    domeload(directory, data)
  })
}

// given the contents of a data.json, initialize the app
function domeload(directory, data){
  if(!validate_data_json(data)){
    console.error("invalid data.json", data);
  }else{
    // successfully loaded a valid data.json
    console.log(data)
    _data = data;
    _dataset_directory = directory;
    initialize(data);
    _loaded = true;
  }
}

// Validates the type structure of data.json
function validate_data_json(data){
  return typeof data["dataset_title"] == "string" && 
    typeof data["audio_directory"] == "string" && 
    typeof data["rolloff_directory"] == "string" && 
    Array.isArray(data["audio"]) &&
    data["audio"].length > 0 &&
    data["dataset_title"].length > 0 &&
    data["audio_directory"].length > 0 &&
    data["rolloff_directory"].length > 0;
  // todo, validate audio structure
}

function get_audio_filename(audio_id){
  return _dataset_directory + "/" + _data.audio_directory + "/" + _data.audio[audio_id]["file"];
}

function get_dataset_name(){
  return _data["dataset_title"];
}

function get_dataset_directory(){
  return _dataset_directory;
}


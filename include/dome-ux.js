////
// view objects
////

// the click+drag spectrum highlighter
// store the information describing the highlighter here
var _highlighter = {
  "audio_id": null,
  "start": 0,
  "end": 0,
}



////////
// HTML ELEMENT CREATORS
///////


// Create an audio spectrum div object
// Includes cursor, filename, highlighter, etc
function audio_list_item(a){
  // single JPG support for now
  // todo: multiple JPGs for long files
  let rolloff_src = _dataset_directory + "/" + _data.rolloff_directory + "/" + a.rolloff[0];
  let chroma_src = _dataset_directory + "/" + _data.chroma_directory + "/" + a.chroma[0];
  let elem = "<div class='audio_list_item' id='aui_"+a.id+"' audio_id='"+a.id+"'>" + 
    "<div class='cursor'></div>" + 
    "<div class='highlighter'></div>" + 
    "<img src='"+rolloff_src+"' class='viz viz_rolloff'>" + 
    "<img src='"+chroma_src+"' class='viz viz_chroma'>" + 
    "<div class='file_name'>" + a.file + "</div>" + 
    "</div>";
  return elem;
}


////////
// DISPLAY UPDATERS
///////

// display the list of audio spectrums
function update_audio_list(audio_list){
  $("#domelist").empty()
  audio_list.forEach(function(a) {
    let list_item = audio_list_item(a);
    $("#domelist").append(list_item);
  });
  update_audio_viz_style();
}

// visually update the cursor to the current position of playback
function update_cursor(){
  let t = audio_player.currentTime;
  let audio_id = audio_player.audio_id;
  // should double check these variables are correctly set here
  let length_seconds = parseFloat(audio_length_seconds(audio_id));
  // the width of the image
  //let w = $("#aui_"+audio_id+" img")[0].width;
  let w = $("#aui_"+audio_id).width();
  // NOTE: this may need to change if there is x-axis scrolling
  // the new cursor position
  let x = 1.0 * t/length_seconds * w; 
  // Looks better if we move the cursor over a bit
  x = Math.max(0, x - 2);
  // set it with jquery
  $("#aui_"+audio_id+" .cursor").css("left", x);
  $("#aui_"+audio_id+" .cursor").show()

}


// visually update the highlighted region of the spectrum
// given two x values 
// only one spectrum is highlighed at a time
function update_highlighter_by_x(audio_id, x0, x1){
  let left_x = Math.min(x0,x1);
  let right_x = Math.max(x0,x1);
  // hide all highlighters
  $(".audio_list_item").removeClass("highlighted");
  // highlight the current audio_id
  $("#aui_"+audio_id).addClass("highlighted");
  $("#aui_"+audio_id+" .highlighter").css("left", left_x);
  $("#aui_"+audio_id+" .highlighter").css("width", right_x - left_x);
  // calculate the start and end times of the highlighted range
  let w = $("#aui_"+audio_id+" img")[0].width;
  let length_seconds =  audio_length_seconds(audio_id);
  let t0 = left_x/w * length_seconds;
  let t1 = right_x/w * length_seconds;
  _highlighter = {
    "audio_id": audio_id,
    "start": t0,
    "end": t1
  }
}

function reset_audio_list(){
  if(_data){
    update_audio_list(_data["audio"]);
  }
}



////////
// MOUSE EVENTS
///////

// remember the mousedown x position
// when clicking on spectrum
// so that we can tell the difference between a click and a click+drag
// use undefined to denote either (1) no mousedown event has happened, or (2) the mouse is up
var _domelist_mousedown_x = undefined;

/*
// disable right click
document.addEventListener("contextmenu", function(e){
  if (e.stopPropagation){
    e.stopPropagation();
  } else if (window.event){
    window.event.cancelBubble = true;
  }
  e.preventDefault();
  //console.log("rightclick")
  return false;
}, false);
*/

// Either start a highlight (click+drag) or play sound (click)
$("#domelist").on("mousedown", ".audio_list_item", function(e){
  // remember the mousedown x position 
  _domelist_mousedown_x = e.offsetX; 
});

// If clicking+dragging, draw the highlighter
$("#domelist").on("mousemove", ".audio_list_item", function(e){
  let audio_id = $(this).attr("audio_id");
  let x = e.offsetX; 
  if(_domelist_mousedown_x !== undefined){
    // draw the highlighter 
    update_highlighter_by_x(audio_id, _domelist_mousedown_x, x )
  }
});

// If the mouseup happened outside of audio_list_item, then unset the mousedown x position
$("body").on("mouseup", function(e){
  // unset the mousedown x
  _domelist_mousedown_x = undefined; 
  e.preventDefault();
})

// Mouseup on the spectrum
// Either play sound, or finish the highlight
$("#domelist").on("mouseup", ".audio_list_item", function(e){
  let audio_id = $(this).attr("audio_id");
  let x = e.offsetX; 
  if(_domelist_mousedown_x == x){
    // this is a click
    // do a playback
    // get the image width
    let w = e.target.width;
    // now x/w is the percentage of the way through the image that was clicked
    // NOTE: this may need to change if there is x-axis scrolling
    let percent_position = x/w; 
    let length_seconds = audio_length_seconds(audio_id);
    // calculate the time that we want to jump to
    let time = percent_position * length_seconds;
    // note that browsers fuck up the exact position +/- a few hundred milliseconds, depending on the browser, operating system, and file format
    // it's probably okay not to be precise here though
    play_audio_at_time(audio_id, time);
  }else{
    // this is a mousemove
    // do a highlight
    update_highlighter_by_x(audio_id, _domelist_mousedown_x, x )
  }
  // unset the mousedown x
  _domelist_mousedown_x = undefined; 
});




// remember the current hue in degrees
var _hue = 0;
// shift the hue by 1/12th of the color wheel
function shift_hue(){
  _hue = (_hue + 30) % 360;
  $("#domelist").css("filter", "hue-rotate("+_hue+"deg)");
  $("#domegrid").css("filter", "hue-rotate("+_hue+"deg)");
}

var _current_audio_viz_style_idx = 0;
function change_audio_viz_style(idx){
  if(idx==undefined){
    _current_audio_viz_style_idx = (_current_audio_viz_style_idx + 1) % 2;
  }else{
    _current_audio_viz_style_idx = idx;
  }
  update_audio_viz_style();
}

function update_audio_viz_style(){
  $(".viz").css("display", "none");
  switch(_current_audio_viz_style_idx){
    case 0:
      $(".viz_rolloff").css("display", "block");
      break;
    case 1:
      $(".viz_chroma").css("display", "block");
      break;
  }
}

function toggle_grid(){
  $("#domegrid_container").toggle();
  update_containers();
}

function toggle_list(){
  $("#domelist_container").toggle();
  update_containers();
}

// Change the grid/list container view 
function update_containers(){
  let grid_hidden = $("#domegrid_container").css("display")=="none"
  let list_hidden = $("#domelist_container").css("display")=="none"
  $("#domelist_container").removeClass("showing_both_list_and_grid")
  $("#domegrid_container").removeClass("showing_only_grid")

  if(grid_hidden){
    // just the list 
  }else if(list_hidden){
    // just the grid
    $("#domegrid_container").addClass("showing_only_grid")
  }else if(!grid_hidden && !list_hidden){
    // showing both
    $("#domelist_container").addClass("showing_both_list_and_grid")
  }
}
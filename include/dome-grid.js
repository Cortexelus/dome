// information about the grid state
var _grid_state = {
  "selected": false,
  "centroid_id":  0,
  "gridw": 10,
  "gridh": 10
}

// Displays the highlighted grid cell, based on grid state
function update_grid_selection(){
  $("#domegrid .grid_cell").removeClass("grid_cell_selected")
  if(_grid_state["selected"]){
    $(".grid_cell[centroid_id="+_grid_state["centroid_id"]+"]").addClass("grid_cell_selected")
  }
}

// draws the rasterfairy grid given the contents of data.json
function draw_grid(data){
  let nn = data["chunks"]["centroids_nn"]
  let rf = data["chunks"]["rasterfairy_grid"]
  let cl = data["chunks"]["chunk_list"]

  // empty the grid 
  $("#domegrid").empty();

  // if JSON doesn't have chunk data, hide the grid and return
  if(data["chunks"]["rasterfairy_grid"]==undefined){
    $("#domegrid_container").hide();
    update_containers();
    return;
  }

  // determine the grid size 
  // this is a hack, hopefully rf is a perfect square
  let n = Math.ceil(Math.sqrt(rf.length));
  _grid_state["gridw"] = n;
  _grid_state["gridh"] = n;

  // loop through every centroid_id on rasterfairy grid data
  for(let i=0;i<rf.length;i++){
    // get the x and y coordinates from rasterfairy grid
    let x = rf[i][0];
    let y = rf[i][1];
    // get some nearest neighbor to the centroid 
    let r = 0;// Math.floor(Math.random()*7);
    let chunk_id = nn[i][r];
    // get the chunk from the chunk_id
    let chunk = cl[chunk_id]
    // get the audio_id associated with the chunk
    let audio_id = chunk["audio_id"]
    // get the audio object represented by that id
    let nna = data["audio"][audio_id]
    // get the html for the grid cell
    let grid_cell_item = grid_cell(x,y,nna,i,chunk);
    // add it
    $("#domegrid").append(grid_cell_item);
  }
}

// returns the grid cell HTML 
function grid_cell(x,y,nna,centroid_id,chunk){
  // single JPG support for now
  // todo: multiple JPGs for long files
  let rolloff_src = _dataset_directory + "/" + _data.rolloff_directory + "/" + nna.rolloff[0];
  let chroma_src = _dataset_directory + "/" + _data.chroma_directory + "/" + nna.chroma[0];

  let start = chunk["start"];
  let duration = chunk["duration"];
  let length = nna["length"];
  let percent_start = start/length; 
  let percent_duration = duration/length; 
  let vizw = 100 * length/duration;
  let vizl = -start/length * vizw;

  let wp = 100.0/_grid_state["gridw"]
  let hp = 100.0/_grid_state["gridh"];
  let top = x*wp + "%";
  let left = y*hp + "%";
  let elem = "<div class='grid_cell' id='grid_"+x+"_"+y+"' \
    gridx='"+x+"' gridy='"+y+"'\
    centroid_id='"+centroid_id+"'\
    style='top: "+top+";left: "+left+"; width:"+wp+"%; height:"+hp+"%;'>\
    <div class='grid_inside' style=''> " + 
    "<img src='"+rolloff_src+"' class='viz viz_rolloff' style='width: "+vizw+"%; left: "+vizl+"%'>" + 
    "<img src='"+chroma_src+"'  class='viz viz_chroma'  style='width: "+vizw+"%; left: "+vizl+"%'>" + 
    "</div></div>";
  // TODO: show only the chunk section
  return elem;
}


////////
// MOUSE EVENT

$("#domegrid").on("mouseup", ".grid_cell", function(e){
  let centroid_id = $(this).attr("centroid_id");
  clicked_grid(centroid_id)
});

// Clicking the grid triggers the list to update with nearest neighbors
// centroid_id is the same as cluster_id
function clicked_grid(centroid_id){
  if(centroid_id == _grid_state["centroid_id"]){
    // clicked in the same grid point?
    // do nothing special
  }
  // this is the list of nearest neighbors to the grid cell cluster centroid
  let nn = _data["chunks"]["centroids_nn"][centroid_id]
  let chunk_list = _data["chunks"]["chunk_list"]
  let audio_list = []
  let audio_id_list = []
  // loop through the neighbors and build a list of audio_objects
  for(let i=0;i<nn.length;i++){
    let chunk = chunk_list[nn[i]]
    let audio_id = chunk["audio_id"];
    let audio_obj = _data["audio"][audio_id]
    // avoid repeats
    if(audio_id_list.indexOf(audio_id)==-1){
      audio_id_list.push(audio_id)
      audio_list.push(audio_obj)
    }
  }
  // updates the list with those audio_objects
  update_audio_list(audio_list)

  // play one of those chunks
  let r = Math.floor(Math.random()*10)
  let chunk = chunk_list[nn[r]]
  let time = chunk["start"]
  let audio_id = chunk["audio_id"];
  play_audio_at_time(audio_id, time);

  // TODO: maybe instead of listing the full audio objects we show a list of chunks? idk

  // scroll to the top 
  $("html, body").animate({ scrollTop: 0 }, "slow");

  // optional: redraw grid for the fuck of it
  draw_grid(_data);
  update_audio_viz_style();
  // update grid selection
  _grid_state["centroid_id"] = centroid_id;
  _grid_state["selected"] = true;
  update_grid_selection();

}


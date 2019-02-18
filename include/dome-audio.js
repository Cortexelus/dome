
// this automatically moves the cursor as the audio is playing
audio_player.ontimeupdate = function(){
  update_cursor();
}

// jump to any random audio, update the list to show all 
function totally_random_jump(){
  reset_audio_list()
  shuffle_list()
  random_list_jump()
}

// jump to any audio on the current list
function random_list_jump(){
  let children = $("#domelist").children();
  let next = Math.floor(Math.random()*children.length)
  let next_audio_id = $(children[next]).attr("id").substr(4) // the id of the element is "aui_###" 
  // start playing this file
  play_audio_at_time(next_audio_id, 0);
}

// return the length of the audio_id audio in seconds
function audio_length_seconds(audio_id){
  // i need to dynamically find the sample_rate somehow
  // maybe better to hardcode "duration" in seconds in the JSON
  // for now hardcode the sr

  //let sr = 44100;
  // length of the audio file in samples
  //let length_samples = _data["audio"][audio_id]["length"];
  // length of the audio in seconds
  //let length_seconds = 1.0 * length_samples / srz
  //return length_seconds;
  return _data["audio"][audio_id]["length"];
}

// start playing the audio at the time in seconds
function play_audio_at_time(audio_id, time){
  //console.log(audio_id, time);
  // check if currenty loaded audio file is this one 
  // load the audio file
  // play function play(url) {
  let audio_file = get_audio_filename(audio_id)
  if(audio_player.src == audio_file){
    seek(time);
  }else{
    // new audio file is playing 

    // load the file
    audio_player.src = audio_file;
    // extra special attribute that we add to the audio_player
    audio_player.audio_id = audio_id; 
    audio_player.load();
    setTimeout(function(){
      // after loading, seek
      seek(time);
    },0)
    // update the display (cursor, highlight)
    $(".audio_list_item").removeClass("playing");
    $("#aui_"+audio_id).addClass("playing");
    update_cursor();

  }
}

// this changes the html5 audio's current position
function seek(time){
  audio_player.currentTime = time;
  // should wrap .play() in a try/catch, in case time is longer than duration
  audio_player.play();
  _audio_has_begun = true
  update_cursor();

  $("#play-button").hide();

}

// Shuffle jQuery array of elements - see Fisher-Yates algorithm
jQuery.fn.shuffle = function () {
    var j;
    for (var i = 0; i < this.length; i++) {
        j = Math.floor(Math.random() * this.length);
        $(this[i]).before($(this[j]));
    }
    return this;
};

// shuffle the songs in the list 
function shuffle_list(){
  $('#domelist').children().shuffle();
}
// jump to the cluster which is most similar to the current audio 
// returns false if no cluster jump could be made
function cluster_jump(){
  // get current time and audio_id
  let audio_id = audio_player.audio_id
  if(audio_id){ 
    let t = audio_player.currentTime
    console.log(t)
    if(t){ 
      // get the current chunk
      let chunk_id = get_chunk(audio_id, t);
      console.log(chunk_id)
      if(chunk_id){
        // find a cluster this chunk belongs to 
        let centroid_id = find_cluster(chunk_id);     
        console.log(centroid_id)
        if(centroid_id){
          // Jump to that cluster
          clicked_grid(centroid_id);
          return true;
        }
      }
    }
  }
  return false;
}

// jump to a random cluster
function random_cluster_jump(){
  let r = Math.floor(Math.random()*100);
  clicked_grid(r);
}
// look through the data to find this chunk
function get_chunk(audio_id, t){
  let cl = _data["chunks"]["chunk_list"];
  for(let chunk_id = 0; chunk_id<cl.length; chunk_id++){
    let chunk = cl[chunk_id]
    if(chunk["audio_id"]==audio_id){
      let end = chunk["start"]+chunk["duration"]+1; // +1 just to make room for the final chunk in a piece
      if(t>chunk["start"] && t<=end){
        // we are inside of this chunk
        // although it is not the only chunk we are inside (because they overlap)
        return chunk_id;
      }
    }
  }
  return false;
}


// if we had the cluster data we could just look it up 
// but we don't, so do a dumb nn search instead:
function find_cluster(chunk_id){
  let nn = _data["chunks"]["centroids_nn"];
  let best_idx = 999999;
  let best_cluster = false;
  for(let cluster_id = 0; cluster_id<nn.length; cluster_id++){
    let cnn = nn[cluster_id]
    let idx = cnn.indexOf(chunk_id)
    if(idx==-1) continue; // this chunk is not in this cluster's nn
    if(idx<best_idx){
      // this cluster is a better match
      best_idx = idx
      best_cluster = cluster_id
    }
  }
  return best_cluster;
}

// start from the beginning of the next audio in list view
// if we're at the bottom, do a cluster_jump
function jump_to_next_audio_in_list(){
  let ended_audio_id = audio_player.audio_id;
  // For now, the next audio file is the next in the JSON list
  // if the list is at the ende, wrap around to the beginning
  // let next_audio_id = (parseInt(ended_audio_id) + 1) % _data.audio.length;
  // Find the next audio in the list view
  // using jquery and not an internal representation
  let next_audio_id = $("#aui_"+ended_audio_id).next().attr("id")
  if(next_audio_id){
    next_audio_id = next_audio_id.substr(4) // the id of the element is "aui_###" 
    // start playing the next audio file;
    play_audio_at_time(next_audio_id, 0);
  }else{
    // we're at the end of the list, do a cluster jump
    if(!cluster_jump()){
      // failed to calcualte the nearest cluster, do a random jump
      random_cluster_jump();
    }
  }
}

// whatever audio is highlighted.. export it! 
function trigger_highlighter_export(){
  export_audio(_highlighter["audio_id"], _highlighter["start"], _highlighter["end"]);
}
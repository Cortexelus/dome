
$("body").on("mousedown", function(e){
  if(_loaded && !_audio_has_begun){
    // first click, before the audio has loaded
    //totally_random_jump();
    //$("#play-button").hide();
    //$("body").addClass("ofthesun")
  }else{
    if (e.target !== this){
      // clicked a descendent
      return;
    }
    // clicked the background body
    totally_random_jump();
  }
  
})

// the current audio file ended
audio_player.onended = function(){
  jump_to_next_audio_in_list();
  /*if(!cluster_jump()){
    // failed to calcualte the nearest cluster, do a random jump
    random_cluster_jump();
  }*/
  //totally_random_jump();
}

// every N minutes, jump to a similar grid point
setInterval(function(){
  cluster_jump()
},1000*60*15)


function initialize(data){
  // hide everything
  //$("#domegrid_container").hide();
  //$("#domelist_container").hide();
  update_containers();
  // draw the grid
  draw_grid(data);
  // draw the main list
  reset_audio_list();
  //setTimeout(function(){totally_random_jump()},5000);


}



////////
// KEY EVENTS
///////



var _last_keys = "";
window.addEventListener("keyup", function(e){
  // track the last typed keys
  _last_keys = _last_keys.slice(-9) + e.key
  
  if (e.key == "f") {
    // show/hide [f]ile names
    $(".audio_list_item .file_name").toggleClass("show");
  }else if (e.key == "d") {
    // turn on/off [d]ivided halfsize spectrums
    $("body").toggleClass("halfsize_spectrums");
  }else if(e.key == "g"){
    // [g]rayscale
    $("#domelist_container").toggleClass("grayscale");
    $("#domegrid_container").toggleClass("grayscale");
  }else if(e.key == "h"){
    // change [h]ue
    shift_hue() 
  }else if(e.key == "r"){
    // [r]eset audio list
    reset_audio_list()
  }else if(e.key == "s"){
    // rotate through rolloff spectrogram / chroma / etc
    change_audio_viz_style()
  }else if(e.key == "e"){
    // [e]xport the current highlight
    trigger_highlighter_export();
  }else if(e.key == "q"){
    // show/hide the grid
    toggle_grid();
  }else if(e.key == "w"){
    // show/hide the list
    toggle_list();
  }else if(e.key == "c"){
    // give me the cluster this belongs in
    cluster_jump();
  }


});

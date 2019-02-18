var _export_i = 0;
var _export_status = "standby";

// Crop the audio from start to end (in seconds), and immediately download it 
function export_audio(audio_id, start, end){
  // get the file name
  let source_audio_file = get_audio_filename(audio_id);
  // todo: sanitize start/end values
  // RENDER
  _render_audio(source_audio_file, start, end, function(blob){
    // Render finished
    // Build the filename for the file about to get downloaded 
    // e.g. dopesmoker001.wav
    let export_filename = get_dataset_directory() + "_" + (""+_export_i).padStart(3, '0') + ".wav";
    _export_i += 1;
    // Donwnload it
    prompt_download(blob, export_filename);
  });
}

// render the audio export using WebAudio's OfflineAudioContext 
function _render_audio(source_audio_file, start, end, callback){

  var context = new OfflineAudioContext(2, 44100*(end-start), 44100);

  function fetch (url, resolve) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () { resolve(request) }
    request.send()
  }

  function onSuccess (request) {
    var audioData = request.response;
    context.decodeAudioData(audioData, onBuffer, onDecodeBufferError)
  }

  function onBuffer (buffer) {
    var source = context.createBufferSource();
    console.info('Got the buffer', buffer);
    source.buffer = buffer;
    source.connect(context.destination);
    source.loop = false;
    source.start(0, start, end-start)
    startRender();
  }

  function onDecodeBufferError (e) {
    console.log('Error decoding buffer: ' + e.message);
    console.log(e);
  }

  function startRender(){
    context.startRendering().then(completeRender).catch(function(err) {
      console.error('Rendering failed: ' + err);
      _export_status = "failed"
      // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
    });
  }

  function completeRender(buffer) {
    //console.log("Finished rendering the offlineAudioContext");
    // Finished rendering the offlineAudioContext       
    console.log("done rendering", buffer);
    // Now create the WAV file
    _export_status = "encoding"
    // Interleave the L and R channels
    let interleaved = interleave_channels(buffer.getChannelData(0), buffer.getChannelData(1))
    // Encode into WAV
    let data = encode_wav(interleaved);
    // Make a blob for downloading
    let blob = new Blob([data], { type: 'audio/wav' });
    _export_status = "complete"
    if(typeof callback === "function"){
      callback(blob);
    }
    return;
  }

  fetch(source_audio_file, onSuccess)

}

// Prompt the user to download the [blob] file with given filename
function prompt_download(blob, filename){
  let url = (window.URL || window.webkitURL).createObjectURL(blob);
  let link = window.document.createElement('a');
  link.href = url;
  link.download = filename || 'output.wav';
  var event = new MouseEvent('click', {
    'view': window,
    'bubbles': true,
    'cancelable': true
  });
  link.dispatchEvent(event);
  return url;
}

///////
// ENCODE WAV
// borrowed from recorder.js
////////


// Interleave the left and right channels into a stereo WAV file
function interleave_channels(inputL, inputR){
  let length = inputL.length + inputR.length;
  let result = new Float32Array(length);
  let r = 0; // render index
  let i = 0; // input index
  while (r < length){
    result[r++] = inputL[i];
    result[r++] = inputR[i];
    i++;
  }
  return result;
}

function encode_wav(samples){
  let buffer = new ArrayBuffer(44 + samples.length * 2);
  let data = new DataView(buffer);
  let sampleRate = 44100;

  /* RIFF identifier */
  write_string(data, 0, 'RIFF');
  /* file length */
  data.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  write_string(data, 8, 'WAVE');
  /* format chunk identifier */
  write_string(data, 12, 'fmt ');
  /* format chunk length */
  data.setUint32(16, 16, true);
  /* sample format (raw) */
  data.setUint16(20, 1, true);
  /* channel count */
  data.setUint16(22, 2, true);
  /* sample rate */
  data.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  data.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  data.setUint16(32, 4, true);
  /* bits per sample */
  data.setUint16(34, 16, true);
  /* data chunk identifier */
  write_string(data, 36, 'data');
  /* data chunk length */
  data.setUint32(40, samples.length * 2, true);

  float_to_16bit_pcm(data, 44, samples);

  return data;
}

function write_string(data, offset, string){
  for (let i = 0; i < string.length; i++){
    data.setUint8(offset + i, string.charCodeAt(i));
  }
}

function float_to_16bit_pcm(output, offset, input){
  for (let i = 0; i < input.length; i++, offset+=2){
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}


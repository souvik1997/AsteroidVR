// DEBUG
var vrHeadset = false;

$(document).ready(function(){
  Physijs.scripts.worker = "third-party/physijs_worker.js";
  var game = new AsteroidVR({
    vrheadset: false,
    hwaccel: true,
    target: "game"
  });
  
  loop = function()
  {
    requestAnimationFrame(loop);
    game.update();
  };
  
  loop();
})

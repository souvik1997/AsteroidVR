// DEBUG
var vrHeadset = false;

$(document).ready(function(){
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

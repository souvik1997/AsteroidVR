/*global AsteroidVR, Physijs */
// DEBUG
var vrheadset = true;
var init = function () {
    Physijs.scripts.worker = "third-party/physijs_worker.js";
    var game = new AsteroidVR({
        vrheadset: vrheadset,
        hwaccel: true,
        target: "game",
        explosions: true,
        maxAsteroids: 100
    });

    var loop = function()
    {
        requestAnimationFrame(loop);
        game.update();
    };

    loop();
};

$(document).ready(function(){
    if (vrheadset)
    {
        $(document).click(function() {
            var element = document.getElementById("game");
            if (element.mozRequestFullScreen)
                element.mozRequestFullScreen();
            else if (element.webkitRequestFullScreen)
                element.webkitRequestFullScreen();
            if (screen.lockOrientation)
                screen.lockOrientation("landscape-primary");
            init();
        });
    }
    else
    {
        init();
    }

});

var AsteroidVR = (function() {
  var self = function(options) 
  {
    if (options.hwaccel)
    {
      this.renderer = new THREE.WebGLRenderer();
    }
    else
    {
      this.renderer = new THREE.CanvasRenderer();
    }
    this.element = this.renderer.domElement;
    this.container = document.getElementById(options.target);
    this.container.appendChild(this.element);
    if (options.vrheadset)
    {
      this.effect = new THREE.StereoEffect(this.renderer);
    }
    else
    {
      this.effect = {
        render: (function(scene, camera) 
        {
          scene.updateMatrixWorld();
          if (camera.parent == null) 
          {
            camera.updateMatrixWorld();
          }
          this.renderer.render(scene, camera);
        }).bind(this),
        setSize: function() {}
      }
    }
    this.clock = new THREE.Clock();
    // Setup scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(90, 1, .001, 700);
    this.camera.position.set(0,0,0);
    this.scene.add(this.camera);
  
    // Add skybox
    var prefix = "assets/images/skybox/skybox-";
    var directions = ["xp", "xn", "yp", "yn", "zp", "zn"];
    var suffix = ".jpg";
    var materials = [];
    for (var i = 0; i < 6; i++)
    {
      materials.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(prefix+directions[i]+suffix),
        side: THREE.BackSide
      }));
    }
    var skybox = new THREE.Mesh(
      new THREE.CubeGeometry(100, 100, 100),
      new THREE.MeshFaceMaterial(materials)
    );
    this.scene.add(skybox);
  
    this.controls = new THREE.FlyControls(this.camera, this.container);
    this.controls.movementSpeed = 10;
    this.controls.rollSpeed = 0.5;
    this._setOrientation = (function(e) {
          if (!e.alpha)
          {
            return;
          }
          this.controls.dispose();
          this.controls = new THREE.DeviceOrientationControls(this.camera, true);
          this.controls.connect();
          this.controls.update();
          window.removeEventListener("deviceorientation", this._setOrientation, true);
        }).bind(this)
    window.addEventListener("deviceorientation", this._setOrientation, true);
    
    this.resize = (function()
    {
      var width = this.container.offsetWidth;
      var height = this.container.offsetHeight;
      this.camera.aspect = width/height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.effect.setSize(width, height);
    }).bind(this);
    
    this.moveForward = function()
    {
      this.camera.translateZ(-0.08);
    }
    
    
    
    
    
    window.addEventListener("resize", this.resize, false);
    setTimeout(this.resize, 1);
  }
  
  self.prototype = 
  {
    update: function()
    {
      this.resize();
      this.controls.update(this.clock.getDelta());
      this.moveForward();
      this.effect.render(this.scene, this.camera);
    }
  };
  return self;
})();
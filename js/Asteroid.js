var Asteroid = (function() {
  var self = function(options) {
    var material = new THREE.MeshLambertMaterial({
      color: options.color
    });
    var points = [];
    var SIZE = 100;
    for (var i = 0; i < Math.random() * 10 + 3; i++)
    {
      points.push(new THREE.Vector3(
        options.position.x + Math.random() * 2*SIZE - SIZE, 
        options.position.y + Math.random() * 2*SIZE - SIZE,
        options.position.z + Math.random() * 2*SIZE - SIZE));
    }
    var geometry = new THREE.ConvexGeometry(points);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position = options.position;
    var MAX_SPEED = 100000;
    this.movementVector = new THREE.Vector3(
      Math.random() * 2*MAX_SPEED - MAX_SPEED,
      Math.random() * 2*MAX_SPEED - MAX_SPEED,
      Math.random() * 2*MAX_SPEED - MAX_SPEED
    );
    var MAX_ROTATION_SPEED = 100;
    this.rotationAxis = new THREE.Vector3(
      points[0].x + Math.random() * 2*SIZE - SIZE,
      points[0].y + Math.random() * 2*SIZE - SIZE,
      points[0].z + Math.random() * 2*SIZE - SIZE
    );
    this.rotationSpeed = Math.random() * 0.05 - 0.1;
    this.options = options;
    this.mesh.updateMatrix();
    this.options.scene.add(this.mesh);
    
  };
  self.prototype = 
  {
    remove: function() {
      var selectedObject = this.options.scene.getObjectByName(this.mesh.name);
      this.options.scene.remove(selectedObject);
    },
    
    update: function(dt) {
      var movement = this.movementVector.clone();
      this.mesh.rotateOnAxis(this.rotationAxis, this.rotationSpeed * dt);
      this.mesh.position.add(movement.multiplyScalar(dt));
      this.mesh.updateMatrix();
    }
  };
  return self;
})();
var Asteroid = (function() {
  var self = function(options) {
    var material = new THREE.MeshLambertMaterial({
      color: options.color
    });
    var points = [];
    var SIZE = Math.random() * 100 + 50;
    this.mass = SIZE;
    for (var i = 0; i < 20; i++)
    {
      points.push(new THREE.Vector3(
        options.position.x + Math.random() * 2*SIZE - SIZE, 
        options.position.y + Math.random() * 2*SIZE - SIZE,
        options.position.z + Math.random() * 2*SIZE - SIZE));
    }
    var geometry = new THREE.ConvexGeometry(points);
    this.mesh = new Physijs.ConvexMesh(geometry, material, SIZE);
    this.mesh.position = options.position;
    var MAX_SPEED = 100;
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
    this.mesh.setLinearVelocity(this.movementVector);
    
  };
  self.prototype = 
  {
    remove: function() {
      var selectedObject = this.options.scene.getObjectByName(this.mesh.name);
      this.options.scene.remove(selectedObject);
    },
    
    update: function(dt) {
      var cloned_position = this.mesh.position.clone();
      cloned_position.multiplyScalar(100 * this.mass/Math.pow(cloned_position.distanceTo(new THREE.Vector3(0,0,0)),2));
      this.mesh.applyCentralForce(cloned_position);
      this.mesh.updateMatrix();
    }
  };
  return self;
})();
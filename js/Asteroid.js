/*global THREE, Physijs */
var Asteroid = (function() {
    var self = function(options) {
        var material = new THREE.MeshLambertMaterial({
            color: options.color
        });
        var points = [];
        var SIZE = Math.random() * 400 + 50;
        this.mass = SIZE;
        for (var i = 0; i < 15; i++)
        {
            var point = new THREE.Vector3(
                Math.random()*2 - 1, 
                Math.random()*2 - 1,
                Math.random()*2 - 1).setLength(SIZE);
            points.push(point);
        }
        var geometry = new THREE.ConvexGeometry(points);
        this.mesh = new Physijs.ConvexMesh(geometry, material, SIZE);
        
        
        this.options = options;
        this.options.scene.add(this.mesh);
        this.mesh.position.copy(options.position);
        this.mesh.__dirtyPosition = true;
        this.needsInit = true;
        
        //this.options.scene.addEventListener("ready", this.initialize.bind(this));
        
        
        
    };
    self.prototype = 
        {
            remove: function() {
                var selectedObject = this.options.scene.getObjectByName(this.mesh.name);
                this.options.scene.remove(selectedObject);
            },
            
            update: function(dt, origin) {
                if (this.needsInit)
                {
                    var MAX_SPEED = 2000;
                    this.movementVector = new THREE.Vector3(
                        Math.random()*2-1,
                        Math.random()*2-1,
                        Math.random()*2-1
                    ).setLength(MAX_SPEED);
                    this.mesh.setLinearVelocity(this.movementVector);
                    this.needsInit = false;
                }
                else
                {
                    var cloned_position = new THREE.Vector3();
                    this.options.scene.updateMatrixWorld();
                    cloned_position.setFromMatrixPosition(this.mesh.matrixWorld).sub(origin);
                    var norm = cloned_position.normalize();
                    var force = norm.multiplyScalar(-100 * this.mass/Math.pow(cloned_position.length(),2));
                    var linearVelocity = this.mesh.getLinearVelocity().clone();
                    force.multiplyScalar(dt);
                    linearVelocity.add(force);
                    this.mesh.setLinearVelocity(linearVelocity);
                }
            }
        };
    return self;
})();

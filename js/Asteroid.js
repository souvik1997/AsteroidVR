/*global THREE, Physijs */
var Asteroid = (function() {
    var self = function(options) {
        var material = new THREE.MeshLambertMaterial({
            color: options.color
        });
        var points = [];
        this.mass = options.mass || Math.random() * 400 + 50;
        for (var i = 0; i < 15; i++)
        {
            var point = new THREE.Vector3(
                Math.random()*2 - 1,
                Math.random()*2 - 1,
                Math.random()*2 - 1).setLength(this.mass);
            points.push(point);
        }
        var geometry = new THREE.ConvexGeometry(points);
        this.mesh = new Physijs.ConvexMesh(geometry, material, this.mass);
        this.mesh.userData = {name:"Asteroid"};

        this.options = options;
        this.options.scene.add(this.mesh);
        this.mesh.position.copy(options.position);
        this.mesh.__dirtyPosition = true;
        this.needsInit = true;


        //this.options.scene.addEventListener("ready", this.initialize.bind(this));



    };
    this.removed = false;
    self.prototype =
        {
            remove: function(dt) {

                this.cloned_position = this.cloned_position || new THREE.Vector3();
                this.cloned_velocity = this.cloned_velocity || this.mesh.getLinearVelocity();
                this.removal_radius = this.removal_radius || 0;
                if (!this.removed)
                {
                    this.options.scene.updateMatrixWorld();
                    this.cloned_position.setFromMatrixPosition(this.mesh.matrixWorld);
                    this.options.scene.remove(this.mesh);
                    if (this.options.onsplit)
                    {
                        this.options.onsplit(this);
                    }
                }
                this.removed = true;
            },

            update: function(dt, origin, attraction) {
                if (this.permanentRemove)
                    return;
                if (this.needsInit)
                {
                    var MAX_SPEED = 500;
                    this.movementVector = new THREE.Vector3(
                        Math.random()*2-1,
                        Math.random()*2-1,
                        Math.random()*2-1
                    ).setLength(MAX_SPEED);
                    this.mesh.setLinearVelocity(this.movementVector);
                    this.needsInit = false;
                    this.count = 0;
                }
                else if (!this.removed)
                {
                    var cloned_position = new THREE.Vector3();
                    this.options.scene.updateMatrixWorld();
                    cloned_position.setFromMatrixPosition(this.mesh.matrixWorld).sub(origin);
                    var norm = cloned_position.normalize();
                    var force = norm.multiplyScalar(-attraction * this.mass/Math.pow(cloned_position.length(),2));
                    var linearVelocity = this.mesh.getLinearVelocity().clone();
                    force.multiplyScalar(dt);
                    linearVelocity.add(force);
                    this.mesh.setLinearVelocity(linearVelocity);
                    /*this.count++;
                      if (this.count > 100)
                      {
                      this.remove(dt);
                      }*/
                }
                else
                {

                    var particleOptions = {
                        positionRandomness: 0,
                        velocityRandomness: 100,
                        color: 0xff6600,
                        colorRandomness: 0.3,
                        turbulence: 10,
                        lifetime: 10,
                        size: 40-this.removal_radius,
                        sizeRandomness: 10
                    };
                    if (this.options.particleSystem)
                    {
                        for (var i = 0; i < 30; i++)
                        {

                            particleOptions.position = this.cloned_position.clone();
                            particleOptions.position.set(
                                particleOptions.position.x + Math.random() * 2*this.mass*this.removal_radius - this.mass*this.removal_radius,
                                particleOptions.position.y + Math.random() * 2*this.mass*this.removal_radius - this.mass*this.removal_radius,
                                particleOptions.position.z + Math.random() * 2*this.mass*this.removal_radius - this.mass*this.removal_radius);
                            particleOptions.velocity = new THREE.Vector3();
                            this.options.particleSystem.spawnParticle(particleOptions);
                        }
                    }
                    this.removed = true;
                    this.removal_radius+=0.1;
                    if (particleOptions.size <= 0)
                    {
                        this.permanentRemove = true;
                        if (this.options.onpermanentremove)
                        {
                            this.options.onpermanentremove(this);
                        }
                    }
                }
            }
        };
    return self;
})();

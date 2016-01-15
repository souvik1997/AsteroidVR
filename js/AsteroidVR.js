/*global THREE, Physijs, Asteroid */
var AsteroidVR = (function() {
    var self = function(options) {
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
                render: (function(scene, camera) {
                    scene.updateMatrixWorld();
                    if (camera.parent === null)
                    {
                        camera.updateMatrixWorld();
                    }
                    this.renderer.render(scene, camera);
                }).bind(this),
                setSize: function() {}
            };
        }
        this.clock = new THREE.Clock(true);
        // Setup scene
        this.scene = new Physijs.Scene();
        this.scene.setGravity(new THREE.Vector3(0,0,0));
        this.camera = new THREE.PerspectiveCamera((options.vrheadset ? 90 : 45), this.container.offsetWidth/this.container.offsetHeight, 1, 100000);

        this.hudcanvas = document.createElement("canvas");
        this.hudcanvas.width = 1024;
        this.hudcanvas.height = 1024;
        this.hudcanvasctx = this.hudcanvas.getContext("2d");
        this.hudcanvasctx.font = "Bold 80px Arial";
        this.hudcanvasctx.fillStyle = "rgba(255,0,0,0.95)";
        this.hudcanvasctx.fillText("Hello!", 150, 500);
        var canvasTexture = new THREE.Texture(this.hudcanvas);
        canvasTexture.wrapS = THREE.RepeatWrapping;
        canvasTexture.repeat.x = -1;
        canvasTexture.needsUpdate = true;
        canvasTexture.minFilter = THREE.LinearFilter;
        var cameraMeshMaterial = new THREE.MeshBasicMaterial({color: 0x000000, map:canvasTexture});
        cameraMeshMaterial.side = THREE.DoubleSide;
        cameraMeshMaterial.transparent = true;
        this.cameraMesh = new Physijs.SphereMesh(new THREE.SphereGeometry(2), cameraMeshMaterial, 100);
        this.scene.add(this.cameraMesh);
        this.cameraMesh.setDamping(0.7, 0.3);
        this.cameraMesh.add(this.camera);
        this.camera.position.set(0,0,0);
        this.cameraMesh.setLinearVelocity(new THREE.Vector3(0,0,-1));
        this.cameraMesh.position.set(0,0,100);
        this.cameraMesh.__dirtyPosition = true;
        //this.scene.add(this.camera);
        this.particleSystem = new THREE.GPUParticleSystem({
            maxParticles: 25000
        });
        this.scene.add(this.particleSystem);

        // Add skybox
        var geometry = new THREE.SphereGeometry(50000, 20, 20);
        var uniforms = {
            texture: { type: 't', value: THREE.ImageUtils.loadTexture("assets/images/skybox/skybox.jpg") }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            vertexShader:   document.getElementById('sky-vertex').textContent,
            fragmentShader: document.getElementById('sky-fragment').textContent
        });

        var skyBox = new THREE.Mesh(geometry, material);
        skyBox.scale.set(-1, 1, 1);
        skyBox.eulerOrder = 'XZY';
        skyBox.renderDepth = 1000.0;
        this.scene.add(skyBox);

        var guide = new THREE.Mesh(new THREE.SphereGeometry(10, 10, 10), new THREE.MeshLambertMaterial({color: 0xFFFFFF}));

        this.scene.add(guide);
        guide.position.set(0,0,0);

        this.controls = new THREE.FlyControls(this.cameraMesh, this.container);
        this.controls.movementSpeed = 1000;
        this.controls.rollSpeed = 0.5;
        this._setOrientation = (function(e) {
            if (!e.alpha)
            {
                return;
            }
            this.controls.dispose();
            this.controls = new THREE.DeviceOrientationControls(this.cameraMesh, true);
            this.controls.connect();
            this.controls.update();
            window.removeEventListener("deviceorientation", this._setOrientation, true);
        }).bind(this);
        window.addEventListener("deviceorientation", this._setOrientation, true);

        this.resize = (function() {
            var width = this.container.offsetWidth;
            var height = this.container.offsetHeight;
            this.camera.aspect = width/height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.effect.setSize(width, height);
        }).bind(this);



        this.asteroids = [];
        for (var i = 0; i < 20; i++)
        {
            var asteroid_options = {
                position: new THREE.Vector3(Math.random() * 8000 - 4000, Math.random() * 8000 - 4000, Math.random() * 8000 - 4000),
                scene: this.scene,
                color: Math.random() * 0xFFFFFF/2 + 0xFFFFFF/2,
                particleSystem: this.particleSystem,
                id: Math.floor(Math.random() * 10000000000000)
            };
            asteroid_options.onsplit = (function(asteroid) {
                if (asteroid.mass > 100)
                {
                    var new1 = jQuery.extend({}, asteroid_options);
                    var new2 = jQuery.extend({}, asteroid_options);
                    new1.position = new THREE.Vector3();
                    new1.position.setX(asteroid.cloned_position.x + Math.random() * asteroid.mass * 2 - asteroid.mass);
                    new1.position.setY(asteroid.cloned_position.y + Math.random() * asteroid.mass * 2 - asteroid.mass);
                    new1.position.setZ(asteroid.cloned_position.z + Math.random() * asteroid.mass * 2 - asteroid.mass);
                    new1.color = asteroid.options.color;
                    new1.mass =  Math.random() * asteroid.mass;
                    new1.id = Math.floor(Math.random() * 10000000000000);
                    this.asteroids.push(new Asteroid(new1));
                    new2.position = new THREE.Vector3();
                    new2.position.setX(asteroid.cloned_position.x + Math.random() * asteroid.mass * 2 - asteroid.mass);
                    new2.position.setY(asteroid.cloned_position.y + Math.random() * asteroid.mass * 2 - asteroid.mass);
                    new2.position.setZ(asteroid.cloned_position.z + Math.random() * asteroid.mass * 2 - asteroid.mass);
                    new2.color = asteroid.options.color;
                    new2.mass = asteroid.mass - new1.mass;
                    new2.id = Math.floor(Math.random() * 10000000000000);
                    this.asteroids.push(new Asteroid(new2));
                }
            }).bind(this);
            asteroid_options.onpermanentremove = (function(asteroid) {
                for (var i = 0; i < this.asteroids.length; i++)
                {
                    if (this.asteroids[i].options.id == asteroid.options.id)
                    {
                        this.asteroids.splice(i, 1);
                        this.scene.remove(asteroid);
                    }
                }
            }).bind(this);
            this.asteroids.push(new Asteroid(asteroid_options));
        }
        this.scene.add(new THREE.AmbientLight( 0x404040 ));
        var pointLight = new THREE.PointLight(0xffffff, 1, 0);
        pointLight.position.set(0,0,0);
        this.scene.add(pointLight);
        var hemisphereLight = new THREE.HemisphereLight(0xfafafa, 0x0e0e0e, 1);
        this.scene.add(hemisphereLight);
        window.addEventListener("resize", this.resize, false);
        setTimeout(this.resize, 1);
        this.frameCount = {frames: 0, time: 0};
    };

    self.prototype =
        {
            update: function() {
                var dt = this.clock.getDelta();
                this.frameCount.time += dt;
                this.frameCount.frames++;
                if (this.frameCount.time >= 1)
                {
                    console.log(this.frameCount.frames+" fps");
                    this.frameCount.frames = 0;
                    this.frameCount.time = 0;
                }

                for (var i = 0; i < this.asteroids.length; i++)
                {
                    this.asteroids[i].update(this.clock.getDelta(), this.cameraMesh.position);
                }

                this.scene.simulate();
                this.resize();
                this.controls.update(dt);
                //console.log(this.cameraMesh.getLinearVelocity());
                this.particleSystem.update(dt);
                this.effect.render(this.scene, this.camera);

            }
        };
    return self;
})();

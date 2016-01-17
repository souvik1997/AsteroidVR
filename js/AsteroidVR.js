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

        this.canvasTexture = new THREE.Texture(this.hudcanvas);
        this.canvasTexture.wrapS = THREE.RepeatWrapping;
        this.canvasTexture.repeat.x = -1;
        this.canvasTexture.needsUpdate = true;
        this.canvasTexture.minFilter = THREE.LinearFilter;
        var cameraMeshMaterial = new THREE.MeshLambertMaterial({color: 0xF00000, map:this.canvasTexture});
        cameraMeshMaterial.side = THREE.DoubleSide;
        cameraMeshMaterial.transparent = true;
        cameraMeshMaterial.opacity = 0.5;
        this.cameraMesh = new Physijs.SphereMesh(new THREE.SphereGeometry(25), cameraMeshMaterial, 100);
        this.cameraMesh.renderOrder = 1;
        this.scene.add(this.cameraMesh);
        this.cameraMesh.setDamping(0.7, 0.3);
        this.cameraMesh.add(this.camera);
        this.camera.position.set(0,0,0);
        var laserShader = {
            vertexShader: "uniform vec3 viewVector;" +
                "uniform float c;" +
                "uniform float p;" +
                "varying float intensity;"+
                "void main() {" +
                "vec3 vNormal = normalize(normalMatrix * normal);" +
                "vec3 vNormel = normalize(normalMatrix * viewVector);" +
                "intensity = pow(c - dot(vNormal, vNormel), p);" +
                "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
            fragmentShader: "uniform vec3 glowColor;" +
                "varying float intensity;" +
                "void main() {"+
                "vec3 glow = glowColor * intensity;" +
                "gl_FragColor = vec4(glow, 1.0); }"
        };
        var laserMaterial = new THREE.ShaderMaterial({
            uniforms: {
                "c": {type: "f", value: 0.6},
                "p": {type: "f", value: 1},
                glowColor: {type: "c", value: new THREE.Color(0xff3250)},
                viewVector: {type: "v3", value: new THREE.Vector3(-30, -35, 100)}
            },
            vertexShader: laserShader.vertexShader,
            fragmentShader: laserShader.fragmentShader,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        var laserGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1000);
        this.rightLaser = new THREE.Mesh(laserGeometry, laserMaterial.clone());
        this.leftLaser = new THREE.Mesh(laserGeometry, laserMaterial.clone());
        this.cameraMesh.add(this.rightLaser);
        this.cameraMesh.add(this.leftLaser);
        this.rightLaser.position.set(2, -3, -30);
        this.leftLaser.position.set(-2, -3, -30);
        this.rightLaser.rotateX(Math.PI/2);
        this.leftLaser.rotateX(Math.PI/2);
        this.rightLaser.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(this.camera.position, this.rightLaser.position);
        this.leftLaser.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(this.camera.position, this.leftLaser.position);
        this.leftLaser.visible = false;
        this.rightLaser.visible = false;
        this.laserTimer = 0;
        this.laserTimerMax = 0.3;
        this.cameraMesh.setLinearVelocity(new THREE.Vector3(0,0,-1));
        this.cameraMesh.position.set(0,0,100);
        this.cameraMesh.__dirtyPosition = true;
        //this.scene.add(this.camera);
        if (options.explosions)
        {
            this.particleSystem = new THREE.GPUParticleSystem({
                maxParticles: 2500
            });
            this.scene.add(this.particleSystem);
        }
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
                id: Math.floor(Math.random() * 10000000000000)
            };
            if (this.particleSystem)
            {
                asteroid_options.particleSystem = this.particleSystem;
            }
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
        /*var cameraPointLight = new THREE.PointLight(0xffffff,1, 0);
          cameraPointLight.position.set(0, 0, 0);
          this.cameraMesh.add(cameraPointLight);*/
        var hemisphereLight = new THREE.HemisphereLight(0xfafafa, 0x0e0e0e, 1);
        this.scene.add(hemisphereLight);
        window.addEventListener("resize", this.resize, false);
        setTimeout(this.resize, 1);
        this.frameCount = {frames: 0, time: 0};
        this.options = options;
    };

    self.prototype =
        {
            update: function() {
                var dt = this.clock.getDelta();
                this.frameCount.time += dt;
                this.frameCount.frames++;
                this.hudcanvasctx.clearRect(0, 0, this.hudcanvas.width, this.hudcanvas.height);

                if (this.frameCount.time >= 1)
                {
                    console.log(this.frameCount.frames+" fps");
                    this.frameCount.frames = 0;
                    this.frameCount.time = 0;
                }
                this.controls.update(dt);
                this.hudcanvasctx.font = "Bold 15px Arial";
                this.hudcanvasctx.fillStyle = "rgba(255,30,0,1)";
                this.hudcanvasctx.rect(150, 550, 80, 30);
                this.hudcanvasctx.stroke();
                this.hudcanvasctx.fillRect(150, 550, (1-this.laserTimer/this.laserTimerMax) * 80, 30);
                if (this.laserTimer > 0)
                {
                    this.laserTimer -= dt;
                    this.hudcanvasctx.fillText("RECHARGING", 150, 500);
                }
                else
                {
                    this.hudcanvasctx.fillText("READY", 150, 500);
                }
                if (this.controls.fire && this.laserTimer <= 0)
                {

                    this.rightLaser.visible = true;
                    this.leftLaser.visible = true;
                    this.scene.updateMatrixWorld();
                    var asteroidMeshes = [];
                    var asteroidMeshMap = {};
                    for (var a of this.asteroids)
                    {
                        a.mesh.geometry.computeFaceNormals();
                        a.mesh.updateMatrixWorld();
                        asteroidMeshes.push(a.mesh);
                        asteroidMeshMap[a.mesh.uuid] = a;
                    }
                    var leftLaserGlobalPosition = new THREE.Vector3();
                    var leftLaserGlobalRotationQuaternion = new THREE.Quaternion();
                    var leftLaserGlobalScale = new THREE.Vector3();
                    this.leftLaser.matrixWorld.decompose(leftLaserGlobalPosition, leftLaserGlobalRotationQuaternion, leftLaserGlobalScale);
                    var leftLaserGlobalRotation = (new THREE.Vector3(0, -1, 0)).applyQuaternion(leftLaserGlobalRotationQuaternion).normalize();
                    var leftRaycaster = new THREE.Raycaster(leftLaserGlobalPosition, leftLaserGlobalRotation, 0, 10000);
                    var leftCollisions = leftRaycaster.intersectObjects(asteroidMeshes, false);
                    console.log(JSON.stringify(leftLaserGlobalRotation));
                    for (var collision of leftCollisions)
                    {
                        if (collision.object.userData.name === "Asteroid")
                        {
                            console.log("Collision with "+collision);
                            asteroidMeshMap[collision.object.uuid].remove();
                        }
                    }
                    var rightLaserGlobalPosition = new THREE.Vector3();
                    var rightLaserGlobalRotationQuaternion = new THREE.Quaternion();
                    var rightLaserGlobalScale = new THREE.Vector3();
                    this.rightLaser.matrixWorld.decompose(rightLaserGlobalPosition, rightLaserGlobalRotationQuaternion, rightLaserGlobalScale);
                    var rightLaserGlobalRotation = (new THREE.Vector3(0, -1, 0)).applyQuaternion(rightLaserGlobalRotationQuaternion).normalize();
                    var rightRaycaster = new THREE.Raycaster(rightLaserGlobalPosition, rightLaserGlobalRotation, 0, 10000);
                    var rightCollisions = rightRaycaster.intersectObjects(asteroidMeshes, false);
                    for (var collision of rightCollisions)
                    {
                        if (collision.object.userData.name === "Asteroid")
                        {
                            console.log("Collision with "+collision);
                            asteroidMeshMap[collision.object.uuid].remove();
                        }
                    }
                    this.laserTimer = this.laserTimerMax;
                }
                else
                {
                    this.rightLaser.visible = false;
                    this.leftLaser.visible = false;
                }
                for (var i = 0; i < this.asteroids.length - this.options.maxAsteroids; i++)
                {
                    this.scene.remove(this.asteroids[0].mesh);
                    this.asteroids.splice(0, 1);
                }
                for (var i = 0; i < this.asteroids.length; i++)
                {
                    this.asteroids[i].update(this.clock.getDelta(), this.cameraMesh.position);
                }
                this.canvasTexture.needsUpdate = true;
                this.scene.simulate();
                // this.resize();
                //console.log(this.cameraMesh.getLinearVelocity());
                if (this.particleSystem)
                {
                    this.particleSystem.update(dt);
                }
                this.effect.render(this.scene, this.camera);

            }
        };
    return self;
})();

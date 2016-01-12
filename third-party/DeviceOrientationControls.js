/*global THREE */
/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

THREE.DeviceOrientationControls = function ( object ) {

    var scope = this;

    this.object = object;
    this.object.rotation.reorder( "YXZ" );

    this.enabled = true;

    this.deviceOrientation = {};
    this.screenOrientation = 0;

    this.thrustEnabled = false;

    var onDeviceOrientationChangeEvent = function ( event ) {

        scope.deviceOrientation = event;

    };

    var onScreenOrientationChangeEvent = function () {

        scope.screenOrientation = window.orientation || 0;
        
    };

    // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

    var setObjectQuaternion = function () {

        var zee = new THREE.Vector3( 0, 0, 1 );

        var euler = new THREE.Euler();

        var q0 = new THREE.Quaternion();

        var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

        return function ( quaternion, alpha, beta, gamma, orient ) {

            euler.set( beta, alpha, - gamma, 'YXZ' );                       // 'ZXY' for the device, but 'YXZ' for us

            quaternion.setFromEuler( euler );                               // orient the device

            quaternion.multiply( q1 );                                      // camera looks out the back of the device, not the top

            quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) );    // adjust for screen orientation

        };

    }();

    
    var touchstart = function(event) {
        event.preventDefault();
        var xpos = event.touches[0].pageX; // screen is rotated
        if ((xpos < screen.width/2))
        {
            this.thrustEnabled = true;
        }
    };

    var touchend  = function(event) {
        event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++)
        {
            var xpos = event.changedTouches[i].pageX; // screen is rotated
            if (xpos < screen.width/2)
            {
                this.thrustEnabled = false;
            }
        }
    };
    

    this.update = function (delta) {

        if ( scope.enabled === false ) return;

        var alpha  = scope.deviceOrientation.alpha ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) : 0; // Z
        var beta   = scope.deviceOrientation.beta  ? THREE.Math.degToRad( scope.deviceOrientation.beta  ) : 0; // X'
        var gamma  = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
        var orient = scope.screenOrientation       ? THREE.Math.degToRad( scope.screenOrientation       ) : 0; // O
        
        setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );
        scope.object.__dirtyRotation = true;

        if (this.thrustEnabled)
        {
            var thrust = (new THREE.Vector3(0, 0, -1)).applyEuler(this.object.rotation).setLength(1000);
            var linearVelocity = this.object.getLinearVelocity().clone();
            thrust.multiplyScalar(delta);
            linearVelocity.add(thrust);
            this.object.setLinearVelocity(linearVelocity);
            
        }

    };

    

    

    var bind = function(scope, fn) {
        return function() {
            fn.apply(scope, arguments);
        };
    };

    var _touchstart = bind(this, touchstart);
    var _touchend = bind(this, touchend);
    this.connect = function() {

        onScreenOrientationChangeEvent(); // run once on load

        window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
        window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
        window.addEventListener("touchstart", _touchstart, false);
        window.addEventListener("touchend", _touchend, false);

        scope.enabled = true;

    };

    this.disconnect = function() {

        window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
        window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
        window.removeEventListener("touchstart", _touchstart, false);
        window.removeEventListener("touchend", _touchend, false);

        scope.enabled = false;

    };
    this.dispose = function () {

        this.disconnect();

    };
    this.connect();
};

/******/ (function(modules) { // webpackBootstrap
    /******/ 	// The module cache
    /******/ 	var installedModules = {};

    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {

        /******/ 		// Check if module is in cache
        /******/ 		if(installedModules[moduleId])
        /******/ 			return installedModules[moduleId].exports;

        /******/ 		// Create a new module (and put it into the cache)
        /******/ 		var module = installedModules[moduleId] = {
            /******/ 			exports: {},
            /******/ 			id: moduleId,
            /******/ 			loaded: false
            /******/ 		};

        /******/ 		// Execute the module function
        /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        /******/ 		// Flag the module as loaded
        /******/ 		module.loaded = true;

        /******/ 		// Return the exports of the module
        /******/ 		return module.exports;
        /******/ 	}


    /******/ 	// expose the modules object (__webpack_modules__)
    /******/ 	__webpack_require__.m = modules;

    /******/ 	// expose the module cache
    /******/ 	__webpack_require__.c = installedModules;

    /******/ 	// __webpack_public_path__
    /******/ 	__webpack_require__.p = "";

    /******/ 	// Load entry module and return exports
    /******/ 	return __webpack_require__(0);
    /******/ })
/************************************************************************/
/******/ ([
    /* 0 */
    /***/ function(module, exports) {

        /* global AFRAME, THREE */

        if (typeof AFRAME === 'undefined') {
            throw new Error('Component attempted to register before AFRAME was available.');
        }

        var EVENTS = {
            CLICK: 'click',
            MOUSEENTER: 'mouseenter',
            MOUSEDOWN: 'mousedown',
            MOUSELEAVE: 'mouseleave',
            MOUSEUP: 'mouseup'
        };

        var STATES = {
            HOVERING: 'cursor-hovering',
            HOVERED: 'cursor-hovered'
        };

        /**
         * Vive cursor component. A modification of the default cursor.
         * Cursor can be fine-tuned by setting raycaster properties.
         *
         * @member {Element} mouseDownEl - Entity that was last mousedowned during current click.
         * @member {Element} intersectedEl - Currently-intersected entity. Used to keep track to
         *         emit events when unintersecting.
         */
        AFRAME.registerComponent('vive-cursor', {
            dependencies: ['raycaster'],
            schema: {
                color: {
                    type: 'color',
                    default: 0x0000ff
                },
                radius: {
                    type: 'number',
                    default: '0.001'
                },
                objects: {
                    type: 'string',
                    default: ''
                }
            },

            /**
             * Set if component needs multiple instancing.
             */
            multiple: false,

            /**
             * Called once when component is attached. Generally for initial setup.
             */
            init: function () {
                var cursorEl = this.el;
                var data = this.data;
                var canvas = cursorEl.sceneEl.canvas;
                this.mouseDownEl = null;
                this.intersectedEl = null;

                // Wait for canvas to load.
                if (!canvas) {
                    cursorEl.sceneEl.addEventListener('render-target-loaded', this.init.bind(this));
                    return;
                }

                // Create laser beam.
                var cursorGeometry = new THREE.CylinderGeometry(data.radius, data.radius, 1000, 32);
                var cursorMaterial = new THREE.MeshBasicMaterial({color: data.color});
                var cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
                // Move mesh so that beam starts at the tip of the controller model.
                cursorMesh.position.z = -500;
                // Rotate mesh so that it points directly away from the controller.
                cursorMesh.rotation.x = 90 * (Math.PI / 180);
                this.el.setObject3D('vive-cursor-mesh', cursorMesh);

                // Prevent laser from interfering with raycaster by setting near property
                var rayCasterSettings = 'near: 0.03; objects: ' + data.objects;
                cursorEl.setAttribute('raycaster', rayCasterSettings);

                // Save event listener bindings (needed for removal).
                this.onIntersectionBind = this.onIntersection.bind(this);
                this.onIntersectionClearedBind = this.onIntersectionCleared.bind(this);
                this.onMouseDownBind = this.onMouseDown.bind(this);
                this.onMouseUpBind = this.onMouseUp.bind(this);
            },

            attachEventListeners: function () {
                var cursorEl = this.el;

                cursorEl.addEventListener('raycaster-intersection', this.onIntersectionBind);
                cursorEl.addEventListener('raycaster-intersection-cleared', this.onIntersectionClearedBind);
                // Mouseup/down mapped to trigger.
                cursorEl.addEventListener('triggerdown', this.onMouseDownBind);
                cursorEl.addEventListener('triggerup', this.onMouseUpBind);
            },

            removeEventListeners: function () {
                var cursorEl = this.el;

                cursorEl.removeEventListener('raycaster-intersection', this.onIntersectionBind);
                cursorEl.removeEventListener('raycaster-intersection-cleared', this.onIntersectionClearedBind);
                cursorEl.removeEventListener('triggerdown', this.onMouseDownBind);
                cursorEl.removeEventListener('triggerup', this.onMouseUpBind);
            },

            /**
             * Trigger mousedown and keep track of the mousedowned entity.
             */
            onMouseDown: function (evt) {
                this.twoWayEmit(EVENTS.MOUSEDOWN);
                this.mouseDownEl = this.intersectedEl;
            },

            /**
             * Trigger mouseup if:
             * - Currently intersecting an entity.
             * - Currently-intersected entity is the same as the one when mousedown was triggered,
             *   in case user mousedowned one entity, dragged to another, and mouseupped.
             */
            onMouseUp: function () {
                this.twoWayEmit(EVENTS.MOUSEUP);
                if (!this.intersectedEl || this.mouseDownEl !== this.intersectedEl) { return; }
                this.twoWayEmit(EVENTS.CLICK);
            },

            /**
             * Handle intersection.
             */
            onIntersection: function (evt) {
                var self = this;
                var cursorEl = this.el;
                var intersectedEl = evt.detail.els[0];  // Grab the closest.

                // Set intersected entity if not already intersecting.
                if (this.intersectedEl === intersectedEl) { return; }
                this.intersectedEl = intersectedEl;

                // Hovering.
                cursorEl.addState(STATES.HOVERING);
                intersectedEl.addState(STATES.HOVERED);
                self.twoWayEmit(EVENTS.MOUSEENTER);
            },

            /**
             * Handle intersection cleared.
             */
            onIntersectionCleared: function (evt) {
                var cursorEl = this.el;
                var intersectedEl = evt.detail.el;

                // Not intersecting.
                if (!intersectedEl || !this.intersectedEl) { return; }

                // No longer hovering.
                intersectedEl.removeState(STATES.HOVERED);
                cursorEl.removeState(STATES.HOVERING);
                this.twoWayEmit(EVENTS.MOUSELEAVE);

                // Unset intersected entity (after emitting the event).
                this.intersectedEl = null;
            },

            /**
             * Helper to emit on both the cursor and the intersected entity (if exists).
             */
            twoWayEmit: function (evtName) {
                var intersectedEl = this.intersectedEl;
                this.el.emit(evtName, {intersectedEl: this.intersectedEl});
                if (!intersectedEl) { return; }
                intersectedEl.emit(evtName, {cursorEl: this.el});
            },

            /**
             * Called when a component is removed (e.g., via removeAttribute).
             * Generally undoes all modifications to the entity.
             */
            remove: function () {
                var cursorEl = this.el;

                // Remove laser beam mesh.
                cursorEl.removeObject3D('vive-cursor-mesh');

                // Remove event listeners.
                this.removeEventListeners();

                // Remove raycaster.
                cursorEl.removeAttribute('raycaster');
            },

            /**
             * Called when entity pauses.
             * Use to stop or remove any dynamic or background behavior such as events.
             */
            pause: function () {
                this.removeEventListeners();
            },

            /**
             * Called when entity resumes.
             * Use to continue or add any dynamic or background behavior such as events.
             */
            play: function () {
                this.attachEventListeners();
            }
        });


        /***/ }
    /******/ ]);
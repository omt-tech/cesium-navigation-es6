import {
  defined,
  Camera,
  Rectangle,
  Cartographic,
  Math as CesiumMath,
  Cesium3DTileset,
  Entity
} from "cesium";
import svgReset from "../svgPaths/svgReset";
import NavigationControl from "./NavigationControl";

/**
 * The model for a zoom in control in the navigation control tool bar
 *
 * @alias ResetViewNavigationControl
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var ResetViewNavigationControl = function (terria, defaultResetView) {
  NavigationControl.apply(this, arguments);

  /**
   * Gets or sets the name of the control which is set as the control's title.
   * This property is observable.
   * @type {String}
   */
  this.name = terria.options.resetTooltip
    ? terria.options.resetTooltip
    : "重置视图";
  this.navigationLocked = false;

  /**
   * Gets or sets the svg icon of the control.  This property is observable.
   * @type {Object}
   */
  this.svgIcon = terria.options.resetSvg ? "" : svgReset;
  this.resetSvg = terria.options.resetSvg;
  this.resetSuccess = terria.options.resetSuccess;

  /**
   * Gets or sets the height of the svg icon.  This property is observable.
   * @type {Integer}
   */
  this.svgHeight = 15;

  /**
   * Gets or sets the width of the svg icon.  This property is observable.
   * @type {Integer}
   */
  this.svgWidth = 15;

  /**
   * Gets or sets the CSS class of the control. This property is observable.
   * @type {String}
   */
  this.cssClass = "navigation-control-icon-reset";
};

ResetViewNavigationControl.prototype = Object.create(
  NavigationControl.prototype
);

ResetViewNavigationControl.prototype.setNavigationLocked = function (locked) {
  this.navigationLocked = locked;
};

ResetViewNavigationControl.prototype.resetView = function () {
  // this.terria.analytics.logEvent('navigation', 'click', 'reset');
  if (this.navigationLocked) {
    return;
  }
  var scene = this.terria.scene;

  var sscc = scene.screenSpaceCameraController;
  if (!sscc.enableInputs) {
    return;
  }

  this.isActive = true;

  var camera = scene.camera;

  if (defined(this.terria.trackedEntity)) {
    // when tracking do not reset to default view but to default view of tracked entity
    var trackedEntity = this.terria.trackedEntity;
    this.terria.trackedEntity = undefined;
    this.terria.trackedEntity = trackedEntity;
  } else {
    // reset to a default position or view defined in the options
    const duration = this.terria.options.duration
      ? this.terria.options.duration
      : 3;
    if (defaultResetView) {
      const orientation = this.terria.options.orientation
        ? this.terria.options.orientation
        : {
            heading: CesiumMath.toRadians(5.729578),
          };
      if (
        defaultResetView &&
        defaultResetView instanceof Cartographic
      ) {
        camera.flyTo({
          destination: scene.globe.ellipsoid.cartographicToCartesian(
            defaultResetView
          ),
          orientation,
          duration,
        });
      } else if (
        defaultResetView &&
        defaultResetView instanceof Rectangle
      ) {
        try {
          Rectangle.validate(defaultResetView);
          camera.flyTo({
            destination: defaultResetView,
            orientation,
            duration,
            complete: this.resetSuccess,
          });
        } catch (e) {
          console.log(
            "Cesium-navigation/ResetViewNavigationControl:   options.defaultResetView Cesium rectangle is  invalid!"
          );
        }
      } else if (
        defaultResetView &&
        defaultResetView.isCesium3DTileset 
      ) {
        try {
          this.terria.zoomTo(
            defaultResetView,
          );
        } catch (e) {
          console.log(
            "Cesium-navigation/ResetViewNavigationControl:   options.defaultResetView Cesium tileset is invalid!"
          );
        }
      } else if (
        defaultResetView &&
        defaultResetView instanceof Entity 
      ) {
        try {
          this.terria.zoomTo(
            defaultResetView,
          );
        } catch (e) {
          console.log(
            "Cesium-navigation/ResetViewNavigationControl:   options.defaultResetView Entity is invalid!"
          );
        }
      } else if (
        defaultResetView &&
        defaultResetView.destination &&
        defaultResetView.orientation 
      ) {
        camera.flyTo({
          destination: defaultResetView.destination,
          orientation: defaultResetView.orientation,
          duration,
          complete: this.resetSuccess,
        });
      }
    } else if (typeof camera.flyHome === "function") {
      camera.flyHome(1);
    } else {
      camera.flyTo({ destination: Camera.DEFAULT_VIEW_RECTANGLE, duration });
    }
  }
  this.isActive = false;
};

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control
 * @abstract
 * @protected
 */
ResetViewNavigationControl.prototype.activate = function () {
  this.resetView();
};

export default ResetViewNavigationControl;

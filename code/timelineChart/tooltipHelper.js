/**
 * tooltip
 */

import * as d3 from "d3";

console.debug = console.log;
//console.debug = function () {}
      
export function tooltipHelper(width, box) {
  let self = this;

  self.box = box || {left: 0, top: 0, right: document.body.clientWidth, bottom: document.body.clientHeight};
  self.width = width || document.body.clientWidth * 0.4;
  self.offset = {x: 10, y: 10};
  self.tooltip = d3.select(document.createElement("div"))
    .call((div) =>
      div
        .style("position", "absolute")
        .style("top", 0)
        .style("font", "0.625em sans-serif")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 0 10px gray")
        .style("max-width", width + "px"));
}

tooltipHelper.prototype.show = function (visible = true) {
  this.tooltip.style("visibility", visible == true? "visible" : "hidden");
}

tooltipHelper.prototype.html = function (html) {
  this.tooltip.html(html);
}

tooltipHelper.prototype.setPosition = function ([x, y]) {
  if (x > (this.box.left + this.box.right) / 2) {
    this.tooltip.style("left", "auto").style("right", this.box.right - x + this.box.left + this.offset.x + "px");
  } else {
    this.tooltip.style("right", "auto").style("left", x + this.box.left + this.offset.x + "px");
  }
  if (y > (this.box.top + this.box.bottom) / 2) {
    this.tooltip.style("top", "auto").style("bottom", this.box.bottom - y + this.box.top + "px");
  } else {
    this.tooltip.style("bottom", "auto").style("top", y + this.box.top + this.offset.y + "px");
  }
}

tooltipHelper.prototype.setBoundBox = function (box) {
  this.box = box;
}

tooltipHelper.prototype.setWidth = function (width) {
  this.width = width;
  this.tooltip.call((div) => div.style("max-width", width + "px"));
}

tooltipHelper.prototype.node = function () {
  return this.tooltip.node();
}

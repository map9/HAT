/**
 * tooltip
 */

import * as d3 from "d3";

console.debug = console.log;
//console.debug = function () {}
      
export class tooltipHelper {
  /**
   * 构建 tooltip 对象
   * @param {{left, top, right, bottom}} box 为 tooltip 显示的范围，坐标为相对 tooltip.node() 的父节点的坐标。
   * @param {number} width tooltip 显示的宽度。
   */
  constructor(box, width) {
    let self = this;

    self.box = box || { left: 0, top: 0, right: document.body.clientWidth, bottom: document.body.clientHeight };
    self.width = width || document.body.clientWidth * 0.4;
    self.offset = { x: 10, y: 10 };
    self.tooltip = d3.select(document.createElement("div"))
      .call((div) => div
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

  show(visible = true) {
    this.tooltip.style("visibility", visible == true ? "visible" : "hidden");
  }

  html(html) {
    this.tooltip.html(html);
  }

  /**
   * 设置 tooltip 在 tooltip.box 中的坐标位置。
   * [x, y] 的范围为 [0, 0, tooltip.box.right - tooltip.box.left, tooltip.box.bottom - tooltip.box.top]。
   * @param {[x, y]} tooltip 提示点位置 
   */
  setPosition([x, y]) {
    const parentBox = this.tooltip.node().parentNode.getBoundingClientRect();
    if (x > (this.box.right - this.box.left) / 2) {
      this.tooltip.style("left", "auto").style("right", parentBox.right - (x + this.box.left) + this.offset.x + "px");
    } else {
      this.tooltip.style("right", "auto").style("left", x + this.box.left + this.offset.x + "px");
    }
    if (y > (this.box.bottom - this.box.top) / 2) {
      this.tooltip.style("top", "auto").style("bottom", parentBox.bottom - (y + this.box.top) + this.offset.y + "px");
    } else {
      this.tooltip.style("bottom", "auto").style("top", y + this.box.top + this.offset.y + "px");
    }
  }

  /**
   * 设置 tooltip 的显示范围。
   * @param {{left, top, right, bottom}} box 为 tooltip 显示的范围，坐标为相对 tooltip.node() 的父节点的坐标。
   */
  setBoundBox(box) {
    this.box = box;
  }

  setWidth(width) {
    this.width = width;
    this.tooltip.call((div) => div.style("max-width", width + "px"));
  }
  
  node() {
    return this.tooltip.node();
  }
}








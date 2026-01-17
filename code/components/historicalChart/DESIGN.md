# HistoricalChart 组件设计方案

基于 TimelineChart 和 GanttChart 两个项目的分析，设计一个融合两者优势的新组件。

---

## 一、需求分析

### 1.1 源项目特点对比

| 特性 | TimelineChart | GanttChart | HistoricalChart (目标) |
|------|---------------|------------|----------------------|
| **时间轴系统** | 多层级Axis + IndexAxis，支持西历/农历 | 单层时间轴 (D3 axisTop) | 采用 TimelineChart 的多层级系统 |
| **缩放/平移** | D3 zoom 行为，支持 zoomLimited | 无 | 采用 TimelineChart 的缩放系统 |
| **布局结构** | 单一 SVG，事件在 eventChart 中渲染 | 4区域布局 (Axis/Labels/Body)，支持滚动 | 采用 GanttChart 的4区域布局 |
| **数据层级** | 扁平事件列表 | 层级分组 (LaneNode 树) | 采用 GanttChart 的层级系统 |
| **Group Bar** | 无 | separate/background 两种模式 | 保留 GanttChart 功能 |
| **Tooltip** | SVG内置 + tooltipHelper | 简单 HTML tooltip | 采用 TimelineChart 的 tooltip 系统 |
| **ActiveAxis** | 鼠标位置垂直线指示 | 无 | 采用 TimelineChart 功能 |
| **主题样式** | LIGHT/DARK CSS变量 | 内联样式 | 采用 TimelineChart 的主题系统 |

### 1.2 核心需求

1. **4区域布局**: Axis、IndexAxis、Label、Body
2. **时间轴**: 采用 TimelineChart 的多层级 Axis 和 IndexAxis
3. **缩放/平移**: TimelineChart 的 D3 zoom 机制
4. **Tooltip**: TimelineChart 的双层 tooltip 系统
5. **ActiveAxis**: 鼠标位置垂直线指示
6. **滚动支持**: GanttChart 的 scrollable 模式
7. **层级数据**: GanttChart 的 LaneNode 树结构和展开/折叠
8. **Group Bar**: GanttChart 的 separate/background 模式

---

## 二、架构设计

### 2.1 模块结构

```
historicalChart/
├── package.json
├── vite.config.js
├── CLAUDE.md
├── src/
│   ├── index.js                    # 模块导出
│   ├── HistoricalChart.js          # 主控制器
│   ├── AxisManager.js              # 时间轴管理 (from TimelineChart)
│   ├── IndexAxisManager.js         # 索引轴管理 (from TimelineChart)
│   ├── LabelRenderer.js            # 标签渲染 (from GanttChart)
│   ├── BodyRenderer.js             # 主体区域渲染
│   ├── BarRenderer.js              # 数据条渲染 (融合两者)
│   ├── GroupBarRenderer.js         # 分组条渲染 (from GanttChart)
│   ├── LaneNode.js                 # 层级节点 (from GanttChart)
│   ├── TooltipManager.js           # Tooltip管理 (from TimelineChart)
│   ├── ZoomManager.js              # 缩放/平移管理
│   ├── ScrollManager.js            # 滚动同步管理
│   ├── style.js                    # 主题样式 (from TimelineChart)
│   └── utils/
│       ├── scales.js               # 比例尺工具
│       ├── layout.js               # 布局算法 (Lanes等)
│       └── calendar.js             # 日历工具 (可选导入)
└── test/
    ├── index.html
    └── demo-data.json
```

### 2.2 类图

```
┌─────────────────────────────────────────────────────────────┐
│                     HistoricalChart                          │
│  - options: ChartOptions                                     │
│  - container: HTMLElement                                    │
│  - dispatch: d3.Dispatch                                     │
│  + render(data, accessors): void                            │
│  + resize(width, height): void                              │
│  + setStyle(style): void                                    │
│  + on(event, callback): this                                │
└─────────────────────────────────────────────────────────────┘
         │
         │ 组合
         ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐
│ AxisManager │  │IndexAxisMgr  │  │LabelRenderer│  │BodyRenderer │
│             │  │              │  │             │  │             │
│ - axises[]  │  │ - brush      │  │ - laneTree  │  │ - barRdr    │
│ - xScale    │  │ - indexScale │  │ - options   │  │ - groupRdr  │
│ + update()  │  │ + update()   │  │ + render()  │  │ + render()  │
└─────────────┘  └──────────────┘  └─────────────┘  └─────────────┘
                                                          │
                                   ┌──────────────────────┼──────────────────────┐
                                   ▼                      ▼                      ▼
                            ┌─────────────┐       ┌──────────────┐      ┌────────────────┐
                            │ BarRenderer │       │GroupBarRender│      │TooltipManager  │
                            │             │       │              │      │                │
                            │ - xScale    │       │ - mode       │      │ - axisTooltip  │
                            │ - yScale    │       │ - opacity    │      │ - eventTooltip │
                            │ + render()  │       │ + render()   │      │ + show/hide()  │
                            │ + update()  │       │              │      │                │
                            └─────────────┘       └──────────────┘      └────────────────┘
```

### 2.3 DOM 结构

```html
<div class="historical-chart-wrapper">
  <!-- Axis 区域 (sticky) -->
  <div class="hc-axis-container">
    <svg class="hc-axis-svg">
      <g class="axises">
        <g class="yearly-axis"/>
        <g class="daily-axis"/>
        <g class="yearly-grid"/>
        <g class="daily-grid"/>
      </g>
      <g class="activeAxis">
        <line/>
      </g>
      <g class="axis-tooltip"/>
    </svg>
  </div>

  <!-- 主内容区域 -->
  <div class="hc-content">
    <!-- Label 区域 (sticky left) -->
    <div class="hc-labels-container">
      <svg class="hc-labels-svg">
        <g class="labels"/>
      </svg>
    </div>

    <!-- Body 区域 (scrollable) -->
    <div class="hc-body-container">
      <svg class="hc-body-svg">
        <defs>
          <clipPath id="body-clip"/>
        </defs>
        <g class="group-bars"/>
        <g class="bars"/>
      </svg>
    </div>
  </div>

  <!-- IndexAxis 区域 (sticky bottom) -->
  <div class="hc-indexaxis-container">
    <svg class="hc-index-svg">
      <g class="index-axis"/>
      <g class="brush"/>
    </svg>
  </div>

  <!-- Tooltip (absolute positioned) -->
  <div class="hc-tooltip"/>
</div>
```

---

## 三、核心功能设计

### 3.1 缩放与滚动的协调

**问题**: TimelineChart 使用 wheel 事件进行缩放，GanttChart 使用 wheel 进行垂直滚动，两者冲突。

**解决方案**:

```javascript
// 交互逻辑设计
const interactionRules = {
  // 鼠标滚轮
  wheel: {
    default: 'verticalScroll',      // 默认垂直滚动
    withCtrl: 'zoom',               // Ctrl + wheel = 缩放
    withShift: 'horizontalPan'      // Shift + wheel = 水平平移
  },

  // 鼠标拖拽
  drag: {
    onAxis: 'horizontalPan',        // 在时间轴区域拖拽 = 水平平移
    onBody: 'verticalScroll',       // 在主体区域拖拽 = 垂直滚动 (可选)
    withCtrl: 'horizontalPan'       // Ctrl + 拖拽 = 水平平移
  },

  // 触控板
  pinch: 'zoom',                    // 双指捏合 = 缩放
  twoFingerPan: 'horizontalPan'     // 双指滑动 = 平移
};
```

**实现方式**:

```javascript
class ZoomManager {
  constructor(options) {
    this.zoom = d3.zoom()
      .scaleExtent([minScale, maxScale])
      .translateExtent([[0, 0], [width, height]])
      .filter(event => {
        // 只在 Ctrl 按下时响应 wheel 缩放
        if (event.type === 'wheel') {
          return event.ctrlKey || event.metaKey;
        }
        return true;
      })
      .on('zoom', this.onZoom.bind(this));
  }
}
```

### 3.2 Axis 系统集成

**保留 TimelineChart 的多层级 Axis 设计**:

```javascript
class AxisManager {
  constructor(container, options) {
    this.axises = options.axises; // 从 TimelineChart 继承的 axis 配置
    this.xScale = d3.scaleUtc().domain(options.timeDomain);
    this.axisObjects = {};
    this.axisNodes = {};
  }

  // 创建 axis 渲染函数 (复用 TimelineChart 逻辑)
  createAxisObject(axis) {
    return (axisNode, hoursPerPixel, scale, y1, y2) => {
      // TimelineChart 的 axis 渲染逻辑
    };
  }

  update(xScale) {
    const hoursPerPixel = this.calculateHoursPerPixel(xScale);
    this.axises.forEach(axis => {
      this.axisNodes[axis.name].call(
        this.axisObjects[axis.name],
        hoursPerPixel, xScale, ...
      );
    });
  }
}
```

### 3.3 IndexAxis 与 Brush

**保留 TimelineChart 的 IndexAxis 设计**:

```javascript
class IndexAxisManager {
  constructor(container, options) {
    this.indexScale = d3.scaleUtc()
      .domain(options.timeDomain)
      .range([0, options.width]);

    this.brush = d3.brushX()
      .extent([[0, 0], [options.width, options.indexAxisHeight]])
      .on('brush', this.onBrush.bind(this));
  }

  // 双向同步: brush <-> zoom
  syncWithZoom(domain) {
    const selection = domain.map(this.indexScale);
    this.brushGroup.call(this.brush.move, selection);
  }

  onBrush(event) {
    if (!event.selection) return;
    const domain = event.selection.map(this.indexScale.invert);
    this.dispatch.call('updateAxises', this, domain);
  }
}
```

### 3.4 ActiveAxis 功能

```javascript
class HistoricalChart {
  setupActiveAxis() {
    this.activeAxis = this.axisContainer.append('g')
      .classed('activeAxis', true);

    this.activeAxisLine = this.activeAxis.append('line')
      .attr('y1', 0)
      .attr('y2', this.getAxisHeight());

    // 监听鼠标移动
    this.chartNode.on('mousemove', (event) => {
      const [x] = d3.pointer(event);
      this.activeAxis.attr('transform', `translate(${x}, 0)`);

      // 更新 axis tooltip
      const date = this.xScale.invert(x);
      this.updateAxisTooltip(date, x);
    });
  }
}
```

### 3.5 数据层级与展开/折叠

**复用 GanttChart 的 LaneNode 结构**:

```javascript
class LaneNode {
  constructor(key, level, field, parent = null) {
    this.key = key;
    this.level = level;
    this.field = field;
    this.parent = parent;
    this.children = [];
    this.items = [];
    this.expanded = true;
    this.rowStart = 0;
    this.rowEnd = 0;
  }

  toggle() {
    this.expanded = !this.expanded;
  }

  getAllItems() {
    if (this.children.length === 0) return this.items;
    return this.children.flatMap(child => child.getAllItems());
  }

  calculateTimeRange() {
    const items = this.getAllItems();
    this.timeStart = d3.min(items, d => d.start);
    this.timeEnd = d3.max(items, d => d.end);
  }
}
```

### 3.6 Tooltip 系统

**融合两种 Tooltip**:

```javascript
class TooltipManager {
  constructor(container) {
    // 1. Axis Tooltip (SVG 内置，显示时间)
    this.axisTooltip = container.append('g')
      .classed('axis-tooltip', true);

    // 2. Event Tooltip (HTML div，显示事件详情)
    this.eventTooltip = d3.select(container.node().parentNode)
      .append('div')
      .classed('hc-tooltip', true);
  }

  showAxisTooltip(date, x, locale) {
    const text = this.formatDate(date, locale);
    // 更新 SVG tooltip
  }

  showEventTooltip(event, x, y, html) {
    // 智能定位 (避免超出边界)
    const pos = this.calculatePosition(x, y);
    this.eventTooltip
      .html(html)
      .style('left', pos.left)
      .style('top', pos.top)
      .style('visibility', 'visible');
  }
}
```

---

## 四、配置选项设计

```typescript
interface HistoricalChartOptions {
  // 尺寸
  width: number;                    // 图表宽度
  height: number;                   // 图表高度
  margin: { top, right, bottom, left };

  // 布局
  labelWidth: number;               // 标签区域宽度
  labelPosition: 'left' | 'right' | 'none';
  axisHeight: number;               // 时间轴区域高度 (auto-calculated)
  indexAxisHeight: number;          // 索引轴高度

  // 时间轴
  timeDomain: [Date, Date];         // 时间范围
  axises: AxisConfig[];             // 时间轴配置 (from TimelineChart)
  hasIndexAxis: boolean;            // 是否显示索引轴
  zoomLimited: [number, number];    // 缩放限制 [minHoursPerPixel, maxHoursPerPixel]

  // 行高
  rowHeight: number;                // 行高 (px)
  minRowHeight: number;             // 最小行高

  // 间距
  xPadding: number;                 // 条目水平间距
  yPadding: number;                 // 条目垂直间距
  roundRadius: number;              // 圆角半径

  // 分组
  groups: GroupConfig[];            // 分组配置
  groupBarMode: 'separate' | 'background';
  groupBarOpacity: number;
  groupYPadding: number;            // 顶层分组间距

  // 滚动
  scrollable: boolean;              // 启用滚动

  // 样式
  style: 'light' | 'dark' | string; // 主题
  locale: string;                   // 语言环境

  // 交互
  activeAxis: boolean;              // 启用 ActiveAxis
  tooltip: boolean;                 // 启用 Tooltip
}

interface GroupConfig {
  field: string;                    // 分组字段
  label: string;                    // 显示标签
  expanded: boolean;                // 默认展开
  selectedValues?: string[];        // 筛选值
}
```

---

## 五、事件系统

```javascript
const events = {
  // 生命周期
  'initial': (box, xScale) => {},       // 初始化完成
  'update': (xScale) => {},             // 缩放/平移更新
  'resize': (width, height) => {},      // 尺寸变化

  // 交互
  'barClick': (data, event) => {},      // 点击条目
  'barHover': (data, event) => {},      // 悬停条目
  'groupToggle': (node, expanded) => {},// 分组展开/折叠

  // 时间轴
  'domainChange': (domain) => {},       // 可见时间范围变化
  'brushEnd': (selection) => {}         // 索引轴选择完成
};
```

---

## 六、使用示例

```javascript
import {
  HistoricalChart,
  westernCalendarAxises,
  chineseCalendarAxises2,
  LIGHT, DARK
} from 'historical-chart';

const chart = new HistoricalChart('#container', {
  width: 1200,
  height: 600,
  timeDomain: [new Date('1800-01-01'), new Date('2020-01-01')],

  // 使用西历 + 农历双轴
  axises: [
    westernCalendarAxises.yearlyAxis,
    chineseCalendarAxises2.yearlyAxis,
    westernCalendarAxises.yearlyGrid
  ],

  // 分组配置
  groups: [
    { field: 'country', label: '国家', expanded: true },
    { field: 'category', label: '类别', expanded: false }
  ],

  groupBarMode: 'separate',
  scrollable: true,
  style: LIGHT,
  locale: 'zh-cn'
});

// 渲染数据
chart.render(data, {
  key: d => d.id,
  start: d => new Date(d.startDate),
  end: d => new Date(d.endDate),
  label: d => d.name,
  color: d => d.color
});

// 事件监听
chart.on('barClick', (data, event) => {
  console.log('Clicked:', data);
});

chart.on('domainChange', (domain) => {
  console.log('Visible range:', domain);
});
```

---

## 七、实现计划

### Phase 1: 基础架构
1. 创建项目结构和构建配置
2. 实现 HistoricalChart 主类框架
3. 实现 4 区域 DOM 布局

### Phase 2: 时间轴系统
4. 移植 AxisManager (from TimelineChart)
5. 移植 IndexAxisManager (from TimelineChart)
6. 实现 ZoomManager (缩放/平移)

### Phase 3: 数据渲染
7. 移植 LaneNode 层级结构 (from GanttChart)
8. 实现 LabelRenderer
9. 实现 BarRenderer
10. 实现 GroupBarRenderer

### Phase 4: 交互功能
11. 实现 ScrollManager (滚动同步)
12. 实现 TooltipManager
13. 实现 ActiveAxis

### Phase 5: 完善
14. 主题样式系统
15. Resize 处理
16. 测试和示例

---

## 八、技术建议

### 8.1 从 TimelineChart 复用的代码

- `westernCalendarAxises.js` - 直接复用
- `chineseCalendarAxises2.js` - 直接复用
- `tooltipHelper.js` - 适配后复用
- `style.js` - 扩展后复用
- Axis 渲染逻辑 - 提取重构

### 8.2 从 GanttChart 复用的代码

- `LaneNode.js` - 直接复用
- 行分配算法 (`assignRows`) - 直接复用
- 分组条渲染逻辑 - 提取重构
- 标签渲染逻辑 - 提取重构

### 8.3 新增/改进

- **ZoomManager**: 新设计，处理缩放与滚动的协调
- **ScrollManager**: 新设计，处理多区域滚动同步
- **模块化拆分**: 将原本的大文件拆分为职责单一的模块

### 8.4 潜在问题与解决

| 问题 | 解决方案 |
|------|----------|
| 缩放与滚动冲突 | 使用修饰键区分 (Ctrl+wheel=缩放，wheel=滚动) |
| 大数据量性能 | 实现虚拟滚动，只渲染可见行 |
| 农历边界问题 | 保持 TimelineChart 的 domain 限制机制 |
| 多区域同步 | 使用 D3 dispatch 事件系统 |

---

## 九、总结

HistoricalChart 融合了：

- **TimelineChart 的优势**: 多层级时间轴、西历/农历支持、缩放平移、IndexAxis、ActiveAxis、主题系统
- **GanttChart 的优势**: 4区域布局、滚动支持、层级分组、展开折叠、Group Bar

通过模块化设计，将两个项目的核心功能整合为一个统一的、可维护的组件。
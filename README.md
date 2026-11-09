# `<rest-calendar>` · 上二休三休息日历组件

> 在线预览：<https://wangyanweiie.github.io/rest-calendar/>
> 手机/微信里直接打开该链接即可；`standalone.html` 是单文件版，可离线打开或发给别人。

零依赖 Web Component（原生 Custom Element + Shadow DOM），单文件即可引入，支持桌面与移动端。

```
calendar/
├── index.html          # 演示页（可直接双击打开）
├── rest-calendar.js    # 组件本体，~21KB，无依赖
├── preview-desktop.png
└── preview-mobile.png
```

## 快速开始

直接双击 `index.html` 即可（`file://` 可用，脚本是普通 script 不是 module）。
自行接入时：

```html
<script src="rest-calendar.js"></script>

<rest-calendar start="2026-11-09" end="2027-02-13" work-days="2" rest-days="3"></rest-calendar>
```

## 属性

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `start` | 今天 | 日历起始日期 `YYYY-MM-DD` |
| `end` | `2027-12-31` | 截止日期 |
| `cycle-start` | 同 `start` | 循环第 1 天；`start` 早于它时会按同一循环向前倒推（本页固定 2026-11-09）|
| `work-days` | `2` | 每周期上班天数 |
| `rest-days` | `3` | 每周期休息天数 |
| `week-start` | `1` | 一周起始，`0`=周日 `1`=周一 |
| `show-holidays` | `true` | 是否显示法定节假日 / 调休 |
| `month` | 当前月 | 初始显示月份 `YYYY-MM` |

## 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| `calendar-ready` | — | 首次渲染完成 |
| `month-change` | `{year, month}` | 切换月份 |
| `day-click` | 单日完整信息对象 | 点击日期 |

```js
document.querySelector('rest-calendar').addEventListener('day-click', e => {
  console.log(e.detail.iso, e.detail.isWork, e.detail.holiday, e.detail.makeup);
});
```

## 方法

| 方法 | 说明 |
| --- | --- |
| `getDayInfo('2027-02-06')` | 单日信息：`cycle` / `restOnWeekend` / `holiday` / `makeup` / `isStatutory` … |
| `getDays()` | 范围内逐日信息数组 |
| `getSummary()` | 统计：`total / work / rest / redOnWeekend / statutoryDays / holidayDays / holidayPeriodDays / makeupDays / redDates` |
| `getHolidayPeriods()` | 官方假期区间：`[{festival, start, end, days, statutory}]`（按当前范围裁剪）|
| `setRange(start, end)` | 改日期范围 |
| `goToMonth(y, m)` | 跳转月份 |
| `setHolidays(map)` | 覆盖节假日数据 |
| `setMakeupDays(map)` | 覆盖调休上班数据 |
| `setHolidayPeriods(list)` | 覆盖官方假期区间 |
| `buildICS()` | 生成 `.ics` 文本 |

演示页还支持深链：`index.html?m=2027-02&start=2026-11-09&end=2027-02-13`。

## 视觉规则

| 状态 | 表现 |
| --- | --- |
| 上班 | 白底 + 灰色「班」 |
| 休息（工作日） | 浅蓝底 + 蓝色「休」 |
| **休息日 ∩ 周末** | **红色渐变底 + 白字「休」** |
| 法定节假日 | 金色「法定」角标 + 节日名（除夕 / 春节 / 初二…） |
| 假期（调休形成） | 金色「假日」角标 |
| 调休上班 | 深色「调」角标（与上二休三冲突时同时保留红色休息标记） |

窄屏（≤640px）下隐藏冗余的「班 / 休」chip（底色已表意），只保留节日名，改为单字角标「节 / 假」。

## 节假日数据

内置数据来自国务院办公厅两份通知：
- 《关于 2026 年部分节假日安排的通知》（国办发明电〔2025〕7 号）
- 《关于 2027 年部分节假日安排的通知》（2026-11-05 发布）

覆盖范围：2026 年 9 月 – 2027 年 12 月。

**2026 年（与当前范围相关部分）**

| 节日 | 放假区间 | 天数 | 法定节假日 | 调休上班 |
| --- | --- | --- | --- | --- |
| 中秋 | 9/25 – 9/27 | 3 | 9/25（1 天） | — |
| 国庆 | 10/1 – 10/7 | 7 | 10/1 – 10/3（3 天） | 10/10（另 9/20 亦为调休上班） |

**2027 年（7 个节日）**

| 节日 | 放假区间 | 天数 | 法定节假日（三倍工资） | 调休上班 |
| --- | --- | --- | --- | --- |
| 元旦 | 1/1 – 1/3 | 3 | 1/1（1 天） | — |
| 春节 | 2/5（除夕）– 2/13（初八） | 9 | 2/5 – 2/8（4 天） | 1/31、2/14 |
| 清明 | 4/3 – 4/5 | 3 | 4/5（1 天） | — |
| 劳动节 | 5/1 – 5/5 | 5 | 5/1、5/2（2 天） | 5/8 |
| 端午 | 6/9 | 1 | 6/9（1 天） | — |
| 中秋 | 9/15 | 1 | 9/15（1 天） | — |
| 国庆 | 10/1 – 10/7 | 7 | 10/1 – 10/3（3 天） | 9/26、10/9 |

法定节假日合计 **13 天**（《全国年节及纪念日放假办法》口径）；官方假期合计 29 天。

数据分两层：
- `holidays`：逐日明细，`type: 'statutory'`（法定节假日）/ `'adjusted'`（调休出来的假期）
- `spans`：官方假期区间，用于「假期共 N 天」统计与节假日总览

节假日区间内的普通周末（如 1/2、1/3）不额外标注——它们本来就是周末。

如需扩展其它年份：

```js
cal.setHolidays({
  '2028-01-01': { name: '元旦', festival: '元旦', type: 'statutory' }
});
cal.setHolidayPeriods([
  { festival: '元旦', start: '2028-01-01', end: '2028-01-03' }
]);
```

## 排班算法

```
pos   = (date - cycleStart) mod (workDays + restDays)
工作日 ⇔ pos < workDays
红线   = 工作日 == false && weekday ∈ {周六, 周日}
```

所有日期按 UTC 计算，避免跨时区 / 夏令时偏移导致的跨天错误。

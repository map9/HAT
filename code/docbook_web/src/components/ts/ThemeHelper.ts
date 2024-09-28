export interface themeParameters {
  currentTheme: number;
  currentSurfaceFont: number;
  currentFontSize: number;
  currentPageSize: number;
  isPageMode: boolean;
}

export interface themeOption {
  name: string;         // theme name
  color: string;        // theme display color
  primary1: string;     // --primary-red-50
  primary2: string;     // --primary-red-300
  primary3: string;     // --primary-red-500
  shadow1: string;      // --shadow-16
  background1: string;  // --background
  background2: string;  // --background-hover-black-4
  surface1: string;     // --surface-gray-50
  surface2: string;     // --surface-gray-100
  surface3: string;     // --surface-gray-500
  surface4: string;     // --surface-gray-900
  border01: string;     // --border-black-8
}

export interface fontFamilysOption {
  name: string;
  fontFamilys: string;
}

export class ThemeHelper {
  // 属性
  private themes: themeOption[] = [
    {
      name: 'day01',
      color: '#E0E0E0',
      primary1: '#ffe6e7',
      primary2: '#ff6f75',
      primary3: '#e5353e',
      shadow1: 'rgba(107, 100, 147, .16)',
      background1: '#fff',
      background2: 'rgba(0, 0, 0, 0.04)',
      surface1: '#f5f5f5',
      surface2: '#ebebeb',
      surface3: '#808080',
      surface4: '#191919',
      border01: 'rgba(0, 0, 0, 0.08)'    
    },
    {
      name: 'day02',
      color: '#F5F1E8',
      primary1: '#ffe6e7',
      primary2: '#ff6f75',
      primary3: '#e5353e',
      shadow1: 'rgba(107, 100, 147, .16)',
      background1: '#faf9f4',
      background2: 'rgba(0, 0, 0, 0.04)',
      surface1: 'rgba(0, 0, 0, 0.08)',
      surface2: 'rgba(0, 0, 0, 0.12)',
      surface3: 'rgba(0, 0, 0, 0.48)',
      surface4: 'rgba(0, 0, 0, 0.9)',
      border01: 'rgba(0, 0, 0, 0.08)'    
    },
    {
      name: 'day03',
      color: '#F4ECD1',
      primary1: '#ffe6e7',
      primary2: '#ff6f75',
      primary3: '#e5353e',
      shadow1: 'rgba(107, 100, 147, .16)',
      background1: '#f4ecd1',
      background2: 'rgba(0, 0, 0, 0.04)',
      surface1: 'rgba(0, 0, 0, 0.08)',
      surface2: 'rgba(0, 0, 0, 0.12)',
      surface3: 'rgba(0, 0, 0, 0.48)',
      surface4: 'rgba(0, 0, 0, 0.9)',
      border01: 'rgba(0, 0, 0, 0.08)'    
    },
    {
      name: 'day04',
      color: '#DAF2DA',
      primary1: '#ffe6e7',
      primary2: '#ff6f75',
      primary3: '#e5353e',
      shadow1: 'rgba(107, 100, 147, .16)',
      background1: '#ebfaeb',
      background2: 'rgba(0, 0, 0, 0.04)',
      surface1: 'rgba(0, 0, 0, 0.08)',
      surface2: 'rgba(0, 0, 0, 0.12)',
      surface3: 'rgba(0, 0, 0, 0.48)',
      surface4: 'rgba(0, 0, 0, 0.9)',
      border01: 'rgba(0, 0, 0, 0.08)'    
    },
    {
      name: 'day05',
      color: '#DCEAEE',
      primary1: '#ffe6e7',
      primary2: '#ff6f75',
      primary3: '#e5353e',
      shadow1: 'rgba(107, 100, 147, .16)',
      background1: '#edf5f7',
      background2: 'rgba(0, 0, 0, 0.04)',
      surface1: 'rgba(0, 0, 0, 0.08)',
      surface2: 'rgba(0, 0, 0, 0.12)',
      surface3: 'rgba(0, 0, 0, 0.48)',
      surface4: 'rgba(0, 0, 0, 0.9)',
      border01: 'rgba(0, 0, 0, 0.08)'    
    },
    {
      name: 'night01',
      color: '#191919',
      primary1: 'rgba(229, 53, 62, 0.16)',
      primary2: 'rgba(229, 53, 62, 0.48)',
      primary3: '#ff4d55',
      shadow1: 'rgba(107, 100, 147, .16)',
      background1: '#1f1f1f',
      background2: 'rgba(255, 255, 255, 0.08)',
      surface1: 'rgba(255, 255, 255, 0.08)',
      surface2: 'rgba(255, 255, 255, 0.12)',
      surface3: 'rgba(255, 255, 255, 0.4)',
      surface4: 'rgba(255, 255, 255, 0.6)',
      border01: 'rgba(255, 255, 255, 0.12)'
    },
  ];
  private nightId: number = 5;
  /* 
   * 1. font-family 规则：
   * 西文在前，中文在后，先苹果系统中文，后windows系统中文，还需考虑android操作系统，然后是系统默认字体，最后serif，sans-serif兜底。
   * 2. 5个字体族：
   * serif。衬线字体族
   * sans-serif。无衬线字体族
   * monospace。等宽字体，即字体中每个字宽度相同
   * cursive。草书字体
   * fantasy。主要是那些具有特殊艺术效果的字体
   * 3. 通用字体
   * system-ui。系统默认字体
   * emoji。用于兼容 emoji 表情符号字符
   * -apple-system，BlinkMacSystemFont。 一般用于苹果系统的向后兼容在system-ui后
   * Segoe UI。windows默认西文字体
   * Roboto。 android默认无衬线字体
   * 4. windows中文字体
   * 宋体 SimSun（浏览器默认）, 黑体 SimHei, 微软雅黑 Microsoft Yahei, 微软正黑体 Microsoft JhengHei, 楷体 KaiTi, 新宋体 NSimSun, 仿宋 FangSong
   * 5. 苹果中文字体
   * "PingFang SC"。苹果默认的中文字体
   * 苹方 PingFang SC, 华文黑体 STHeiti, 华文楷体 STKaiti, 华文宋体 STSong, 华文仿宋 STFangsong, 华文中宋 STZhongsong
   * 6. 默认字体建议
   * fontFamilys: "PingFang SC","Microsoft Yahei",system-ui,-apple-system,BlinkMacSystemFont,segoe UI,Roboto,Helvetica,Arial,sans-serif,apple color emoji,segoe ui emoji,segoe ui symbol;
   */
  private fonts: fontFamilysOption[] = [
    {
      name: '黑体',
      fontFamilys: 'SourceHanSansSC-Regular,SourceHanSansCN-Regular,PingFangSC-Regular,"Microsoft YaHei",system-ui,-apple-system,Segoe UI,Roboto,Emoji,Helvetica,Arial,sans-serif',
    },
    {
      name: '宋体',
      fontFamilys: 'SourceHanSerifSC-Regular,SourceHanSerifCN-Regular,STSong,Simsun,system-ui,-apple-system,Georgia,Times New Roman,Times,serif',
    },
    {
      // 好像楷体设置在苹果的浏览器不能正确响应，但在edge和chrome中能正确显示。
      name: '楷体',
      fontFamilys: 'KaitiSC-Regular,STKaiti,Kaiti,system-ui,-apple-system,Georgia,Times New Roman,Times,serif',
    },
  ];
  private fontSizeBound: number[] = [12, 28];
  private pageSizes: number[] = [0, 800, 900, 1000, 1200];

  // 构造函数
  constructor(themes: themeOption[] | undefined = undefined, nightId:number | undefined = undefined, fonts:fontFamilysOption[] | undefined = undefined) {
      this.themes = themes || this.themes;
      this.nightId = nightId || this.nightId;
      this.fonts = fonts || this.fonts;
  }
  
  getBackgroundColors():string[]{
    const backgroundColors:string[] = [];
    for(var theme of this.themes){
      backgroundColors.push(theme.color);
    }
    return backgroundColors;
  }

  getFontFamilys():fontFamilysOption[]{
    return this.fonts;
  }

  getFontSizeBound():number[]{
    return this.fontSizeBound;
  }

  getPageSizes():number[]{
    return this.pageSizes;
  }

  getNightId():number{
    return this.nightId;
  }

  // 方法
  isNightTheme(id: number | undefined) {
    return id === this.nightId;
  }

  isDayTheme(id: number | undefined) {
    return id !== this.nightId;
  }

  setTheme(id: number): number | boolean {
    if(id < 0 || id > this.themes.length - 1) return false;
    //console.debug(this.themes[id]);

    document.documentElement.style.setProperty('--primary-red-50', this.themes[id].primary1);
    document.documentElement.style.setProperty('--primary-red-300', this.themes[id].primary2);
    document.documentElement.style.setProperty('--primary-red-500', this.themes[id].primary3);
    document.documentElement.style.setProperty('--shadow-16', this.themes[id].shadow1);
    document.documentElement.style.setProperty('--background', this.themes[id].background1);
    document.documentElement.style.setProperty('--background-hover-black-4', this.themes[id].background2);
    document.documentElement.style.setProperty('--surface-gray-50', this.themes[id].surface1);
    document.documentElement.style.setProperty('--surface-gray-100', this.themes[id].surface2);
    document.documentElement.style.setProperty('--surface-gray-500', this.themes[id].surface3);
    document.documentElement.style.setProperty('--surface-gray-900', this.themes[id].surface4);
    document.documentElement.style.setProperty('--border-black-8', this.themes[id].border01);

    return id;
  }

  setDayTheme():  number | boolean {
    return this.setTheme(0);
  }

  setNightTheme():  number | boolean {
    return this.setTheme(this.nightId);
  }

  setFontFamily(id: number){
    if(id < 0 || id > this.fonts.length - 1) return;
    document.documentElement.style.setProperty('--reader-font-family', this.fonts[id].fontFamilys);
  }

  setFontSize(size: number){
    if(size >= this.fontSizeBound[0] && size <= this.fontSizeBound[1]){
      document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
    }
  }

  setPageSize(index: number){
    if(index < 0 || index > this.pageSizes.length - 1) return;
    if(this.pageSizes[index] === 0) return;
    document.documentElement.style.setProperty('--page-size', `${this.pageSizes[index]}px`);
  }
}
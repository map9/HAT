// stores/query.js
import { defineStore } from 'pinia'
import { SearchRange } from '../components/ts/BookDefine';

export interface SearchParamsItem {
  searchString: string;
  searchRange: SearchRange;
}

export const useSearchStore = defineStore('search', {
  state: () => {
    return {
      searchHistory: [] as SearchParamsItem[],  // 明确指定为字符串数组
    }
  },
  actions: {
    addSearchText(text: string, range: SearchRange) {
      if(text.length === 0)
        return;
      // 删除已经存在的搜索item
      for(var i: number = 0;  i < this.searchHistory.length; i ++){
        if (this.searchHistory[i].searchString === text && this.searchHistory[i].searchRange === range){
          this.searchHistory.splice(i, 1);
          break;
        }
      }

      // 将当前搜索的item删除
      this.searchHistory.unshift({searchString: text, searchRange: range});
      //console.log(this.searchHistory);
    },
    // 可以根据需要添加更多的方法和类型
  }
})
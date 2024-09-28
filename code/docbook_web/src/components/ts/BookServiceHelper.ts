import axios from "axios";
import {useToast} from "vue-toastification";

const toast = useToast();

export async function searchArchive(q?: string, f?: Function): Promise<void> {
  let queryString: string = "/api/book/search?";
  let surround: number = 60;

  if (q && q.length) {
    queryString += `q=${q}&&surround=${surround}`;

    try {
      const response = await axios.get(queryString);
      if (!response.data.result_pieces || (response.data.result_pieces && response.data.result_pieces.length == 0)) {
        toast.info(`没有搜索到包含:${q}的内容。`);
      } else {
        if (f) f(response.data);
      }
    } catch (error) {
      toast.error(`搜索文献库出现错误:${error}。`);
    }
  } else {
    toast.error(`请输入搜索关键字，可以用and or not来组合。`);
  }
}

export async function getBookList(q?: string, f?: Function): Promise<void> {
  let queryString: string = "/api/book/list?";

  if (q && q.length) {
    queryString += `q=${q}`;
  }
  try {
    const response = await axios.get(queryString);
    if (!response.data.result_pieces || (response.data.result_pieces && response.data.result_pieces.length == 0)) {
      if (q && q.length){
        toast.error(`找不到书名为:${q}的书籍。`);
      } else {
        toast.error(`找不到任何书籍。`);
      }
    } else {
      if (f) f(response.data);
    }
  } catch (error) {
    toast.error(`搜索书籍出现错误:${error}。`);
  }
}

export async function getBookCatalogue(bid: string, f?: Function): Promise<void> {
  if (bid && bid.length) {
    try {
      let queryString = `/api/book/catalogue?bid=${encodeURIComponent(bid)}`;

      const response = await axios.get(queryString);
      if (f) f(response.data);
    } catch (error) {
      toast.error(`获取书籍目录出现错误: ${error}`);
    }
  } else {
    toast.error(`请提供正确的书籍标识。`);
  }
}

export async function getBookChapters(bid: string, cid?: string, f?: Function): Promise<void> {
  if (bid && bid.length) {
    try {
      let queryString = `/api/book/chapters?bid=${encodeURIComponent(bid)}`;
      if (cid !== undefined) {
        queryString += `&cid=${cid}`;
      }

      const response = await axios.get(queryString);
      if (f) f(response.data);
    } catch (error) {
      toast.error(`获取书籍章节集合出现错误: ${error}`);
    }
  } else {
    toast.error(`请提供正确的书籍标识。`);
  }
}

export async function getBookChapter(bid: string, cid: string, f?: Function): Promise<void> {
  if (bid && bid.length) {
    try {
      let queryString = `/api/book/chapter?bid=${encodeURIComponent(bid)}`;
      if (cid !== undefined) {
        queryString += `&cid=${cid}`;
      }

      const response = await axios.get(queryString);
      if (f) f(response.data);
    } catch (error) {
      toast.error(`获取书籍章节内容出现错误: ${error}`);
    }
  } else {
    toast.error(`请提供正确的书籍及章节标识。`);
  }
}
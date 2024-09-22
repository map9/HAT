import { RouteLocationNormalized } from "vue-router"

export function getStringParam(route: RouteLocationNormalized, paramName: string): string | undefined {
  // 如果参数调用时采用
  // /path?参数名=值
  // /path/值 – 需要路由对象提前配置 path: “/path/参数名”
  // 对应页面组件接收传递过来的值
  // $route.query.参数名 or route.query.参数名
  // $route.params.参数名 or route.params.参数名
  const param = route.query[paramName];
  if (typeof param === 'string') {
    return param;
  } else if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') {
    // 如果参数以数组形式出现，您可以选择返回数组的第一个元素
    // 或者根据您的需求进行其他处理
    return param[0];
  }
  return undefined;
}
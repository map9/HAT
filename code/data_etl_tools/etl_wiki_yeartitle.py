import requests
from bs4 import BeautifulSoup
from bs4 import NavigableString, Tag
import csv
import re

# 配置请求头，模拟浏览器访问
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def get_wiki_content(url):
    """获取维基百科页面原始内容"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        response.encoding = 'utf-8'
        return response.text
    except Exception as e:
        print(f"页面获取失败：{e}")
        return None

def clean_text(text):
    """轻量清理文本：仅去无效符号/换行，不处理繁简、不修改语义"""
    if not text:
        return ""
    return text.strip().replace('\n', '').replace('\xa0', '').replace('\t', '').replace('  ', ' ')

def split_posthumous_and_name(text):
    """
    用正则拆分「谥号+姓名」组合文本（如「魏明帝曹叡」→ 魏明帝、曹叡）
    :param text: 待拆分的文本（如"魏明帝曹叡"、"汉武帝刘彻"、"唐高祖李渊"）
    :return: (posthumous, name) 元组，拆分失败则返回("", "")
    """
    # 核心正则规则：
    # (.*?[帝|祖|宗|公|王|皇|后]) ：非贪婪匹配到「帝/祖/宗」等标识词（谥号部分）
    # (.*) ：匹配剩余的纯姓名部分
    pattern = r'^(.*?[帝|祖|宗|公|王|皇|后])(.*)$'
    
    # 清理文本（去空格、换行、特殊字符）
    clean_text = text.strip().replace('\n', '').replace(' ', '').replace('\xa0', '')
    
    # 执行匹配
    match = re.match(pattern, clean_text)
    if match:
        # 提取并清理谥号、姓名
        posthumous = match.group(1).strip()  # 谥号/庙号
        name = match.group(2).strip()        # 姓名
        return posthumous, name
    else:
        # 匹配失败（无标识词），返回空值（可根据需求调整，如返回(text, "")）
        return "", ""

def parse_time(text):
    if '（' in text and '）' in text:
        match = re.search(r'(.*)（在位：(.*)）', text)
        if match:
            name = clean_text(match.group(1))
            time = clean_text(match.group(2))
            return name, time
    return '', ''

def extract_ruler_info(ruler_row):
    """
    从统治者单元格BS4对象（<th>/<td>）中提取谥号、姓名和在位时间
    核心：通过子节点（child）的类型（文本/标签）+ 括号特征拆分
    :param ruler_row: BeautifulSoup的Tag对象（<th>或<td>）
    :return: (ruler_posthumous, ruler_name, ruler_time) 三元组
    """
    ruler_posthumous = ""
    ruler_name = ""
    ruler_time = ""
    
    # 找 ruler_row 的child
    text_parts = []
    for child in ruler_row.children:
      # 区分文本节点（NavigableString）和标签节点（Tag）
        if isinstance(child, NavigableString):
            # 清理文本节点的无效字符，非空才保留
            clean_text = child.strip().replace('\n', '').replace(' ', '')
            if clean_text:
                text_parts.append(clean_text)
        elif isinstance(child, Tag) and child.name == 'a':
            # 记录第一个<a>标签（核心锚点）
            a_tag = child
            a_text = a_tag.get_text(strip=True) if a_tag else ""
            if a_text:
                text_parts.append(a_text)
        continue

    if (len(text_parts) == 3):
      prefix, ruler_time = parse_time(text_parts[2])
      ruler_posthumous = text_parts[0]
      ruler_name = text_parts[0]
    elif (len(text_parts) == 2):
      ruler_name, ruler_time = parse_time(text_parts[1])
      ruler_posthumous = text_parts[0]
    elif (len(text_parts) == 1):
      ruler, ruler_time = parse_time(text_parts[0])
      ruler_posthumous, ruler_name = split_posthumous_and_name(ruler)
    else:
      print(f"Error to extract {ruler_row}")
      return '', '', ''

    return ruler_posthumous, ruler_name, ruler_time

def parse_regime(table):
    # 自动提取表格所属的分段/朝代/政权
    period = ""
    dynasty = ""
    regime = ""

    # 1. 提取分段(h2)
    prev_elem = table.find_previous(['h2'])
    if prev_elem:
        period = clean_text(prev_elem.get_text())

    # 2. 提取朝代(h3)
    prev_elem = table.find_previous(['h3'])
    if prev_elem:
        dynasty = clean_text(prev_elem.get_text())

    # 3. 提取政权(b)
    prev_elem = table.find(['caption'])
    if prev_elem:
        prev_text = clean_text(prev_elem.get_text())
        # 移除硬编码约束，提取标题中「年号」前的核心名称（适配所有政权）
        regime_match = re.search(r'(.*)年号', prev_text)
        if regime_match:
            regime = clean_text(regime_match.group(1))
    return period, dynasty, regime


def parse_year_table(html):
    """核心解析：无朝代约束，自动提取所有网页中出现的朝代/政权"""
    soup = BeautifulSoup(html, 'html.parser')
    all_tables = soup.find_all('table', {'class': 'wikitable'})
    result = []

    for table in all_tables:
        period, dynasty, regime = parse_regime(table)
        ruler_posthumous = ""
        ruler_name = ""
        ruler_time = ""

        rows = table.find_all('tr')
        is_other_header = False  # 标记「XXX统治地区出现过的其他年号」板块

        for row in rows:
            cells = row.find_all(['td', 'th'])
            cell_texts = [clean_text(cell.get_text()) for cell in cells]
            col_num = len(cell_texts)

            # 初始化字段
            year_title = ""
            time_range = ""
            use_years = ""
            remarks = ""

            # 提取统治者谥号和姓名
            if (col_num == 1):
              ruler_posthumous, ruler_name, ruler_time = extract_ruler_info(cells[0])
              continue

            # 步骤3：过滤表头
            header_kw = ['年号', '起讫时间', '使用年数', '备注']
            is_header = len(set(cell_texts) & set(header_kw)) >= 4
            if is_header:
                continue
            header_kw = ['年号', '起讫时间', '君主', '使用时间', '备注']
            is_header = len(set(cell_texts) & set(header_kw)) >= 5
            if is_header:
                is_other_header = True
                continue

            # 解析常规年号表格
            if not is_other_header:
              year_title = cell_texts[0]
              time_range = cell_texts[1]
              use_years = cell_texts[2]
              remarks = cell_texts[3] if (col_num == 4) else (result[-1][9] if len(result) else "")
            # 解析「XXX统治地区出现过的其他年号」表格
            else:
              ruler_posthumous = ""
              ruler_name = cell_texts[2]
              ruler_time = ""
              year_title = cell_texts[0]
              time_range = cell_texts[1]
              use_years = cell_texts[3]
              remarks = cell_texts[4] if (col_num == 5) else (result[-1][9] if len(result) else "")

            # 最终清理
            period = clean_text(period)
            dynasty = clean_text(dynasty)
            regime = clean_text(regime)
            ruler_posthumous = clean_text(ruler_posthumous)
            ruler_name = clean_text(ruler_name)
            year_title = clean_text(year_title)
            time_range = clean_text(time_range)
            use_years = clean_text(use_years)
            remarks = clean_text(remarks)

            result.append([period, dynasty, regime, ruler_posthumous, ruler_name, ruler_time, year_title, time_range, use_years, remarks])

    return result

def save_to_csv(data, filename='etl_wiki_yeartitle.csv'):
    """保存为CSV，utf-8-sig编码避免乱码"""
    headers = ['分期', '朝代', '政权', '统治者谥号', '统治者姓名', '统治者在位时间', '年号', '起讫时间', '使用年数', '备注']
    try:
      with open(filename, "w", encoding="utf-8-sig", newline="") as f:
          # 设置 quoting=csv.QUOTE_ALL，强制所有字段加双引号
          writer = csv.writer(f, quoting=csv.QUOTE_ALL)
          writer.writerow(headers)  # 表头也会加引号
          writer.writerows(data)    # 数据行所有字段加引号
          print(f"提取完成！共{len(data)}条有效记录，文件保存至：{filename}")
    except Exception as e:
        print(f"CSV保存失败：{e}")

if __name__ == '__main__':
    TARGET_URL = 'https://zh.wikipedia.org/zh-cn/%E4%B8%AD%E5%9B%BD%E5%B9%B4%E5%8F%B7%E5%88%97%E8%A1%A8'
    html_content = get_wiki_content(TARGET_URL)
    if html_content:
        year_data = parse_year_table(html_content)
        save_to_csv(year_data)
        # 预览提取到的所有唯一朝代/政权，验证无约束提取效果
        #all_dynasties = set([row[0] for row in year_data if row[0]])
        #all_regimes = set([row[1] for row in year_data if row[1]])
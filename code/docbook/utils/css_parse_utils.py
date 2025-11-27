import json
import re
from typing import Dict, List, Any

class SimpleCSSParser:
    def __init__(self):
        # 简化正则，只匹配顶级结构
        self.comment_pattern = re.compile(r'/\*.*?\*/', re.DOTALL)  # 匹配注释
        self.media_pattern = re.compile(r'@media\s+([^{]+)\{([^}]+)\}', re.DOTALL)  # 媒体查询
        self.rule_pattern = re.compile(r'([^{]+?)\{([^}]+?)\}', re.DOTALL)  # 顶级规则（非贪婪匹配）
        self.property_pattern = re.compile(r'([\w-]+)\s*:\s*([^;]+?)(?=;|$)', re.DOTALL)  # 属性值

    def clean_css(self, css_text: str) -> str:
        """清理CSS：移除注释、多余空格"""
        # 1. 移除注释
        css_text = self.comment_pattern.sub('', css_text)
        # 2. 移除多余空格和空行
        css_text = re.sub(r'\s+', ' ', css_text)
        # 3. 清理选择器和大括号的空格
        css_text = re.sub(r'\{ ', '{', css_text)
        css_text = re.sub(r' \}', '}', css_text)
        return css_text.strip()

    def parse_properties(self, style_text: str) -> Dict[str, str]:
        """解析样式属性（只处理标准键值对）"""
        properties = {}
        matches = self.property_pattern.findall(style_text.strip())
        for prop_name, prop_value in matches:
            prop_name = prop_name.strip()
            prop_value = prop_value.strip()
            if prop_name:  # 过滤空属性名
                properties[prop_name] = prop_value
        return properties

    def parse_top_level_rules(self, css_text: str, media_condition: str = None) -> List[Dict[str, Any]]:
        """解析顶级规则（不处理嵌套）"""
        rules = []
        # 匹配所有顶级规则
        for match in self.rule_pattern.finditer(css_text):
            selector_text = match.group(1).strip()
            style_text = match.group(2).strip()

            # 跳过空选择器或空样式块
            if not selector_text or not style_text:
                continue

            # 解析选择器（支持多个选择器用逗号分隔）
            selectors = [s.strip() for s in selector_text.split(',') if s.strip()]
            # 过滤无效选择器（包含大括号等非法字符）
            selectors = [s for s in selectors if '{' not in s and '}' not in s]

            # 解析属性
            properties = self.parse_properties(style_text)

            # 只添加有效规则
            if selectors and properties:
                rule = {
                    'selectors': selectors,
                    'properties': properties
                }
                # 添加媒体条件（如果有）
                if media_condition:
                    rule['media'] = media_condition
                rules.append(rule)
        return rules

    def parse_all(self, css_text: str) -> List[Dict[str, Any]]:
        """解析所有非嵌套CSS规则"""
        cleaned_css = self.clean_css(css_text)
        if not cleaned_css:
            return []

        all_rules = []
        remaining_css = cleaned_css

        # 1. 先解析媒体查询（优先处理，避免被普通规则匹配）
        while True:
            media_match = self.media_pattern.search(remaining_css)
            if not media_match:
                break

            # 提取媒体条件和内部CSS
            media_condition = media_match.group(1).strip()
            media_css = media_match.group(2).strip()
            # 解析媒体查询内的顶级规则
            media_rules = self.parse_top_level_rules(media_css, media_condition)
            all_rules.extend(media_rules)

            # 移除已处理的媒体查询
            remaining_css = remaining_css[:media_match.start()] + remaining_css[media_match.end():]

        # 2. 解析剩余的顶级规则（非媒体查询内的）
        normal_rules = self.parse_top_level_rules(remaining_css)
        all_rules.extend(normal_rules)

        # 3. 去重（避免重复规则）
        unique_rules = []
        seen = set()
        for rule in all_rules:
            key = (
                tuple(sorted(rule['selectors'])),
                frozenset(rule['properties'].items()),
                rule.get('media', '')
            )
            if key not in seen:
                seen.add(key)
                unique_rules.append(rule)

        return unique_rules

    def css_to_json(self, css_text: str) -> Dict[str, Any]:
        """CSS转JSON结构"""
        rules = self.parse_all(css_text)
        return {
            'css_version': 'CSS3',
            'rule_count': len(rules),
            'rules': rules
        }

def read_css_to_json(css_file_path: str, indent: int = 4, ensure_ascii: bool = False) -> str:
    """
    读取非嵌套CSS文件并转换为JSON字符串
    
    Args:
        css_file_path: CSS文件路径
        indent: JSON缩进空格数
        ensure_ascii: 是否确保ASCII编码（支持中文）
    
    Returns:
        格式化JSON字符串
    """
    try:
        # 读取CSS文件
        with open(css_file_path, 'r', encoding='utf-8') as f:
            css_content = f.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"CSS文件不存在: {css_file_path}")
    except Exception as e:
        raise IOError(f"读取CSS文件失败: {str(e)}")

    # 解析并转换为JSON
    parser = SimpleCSSParser()
    json_data = parser.css_to_json(css_content)
    return json.dumps(json_data, indent=indent, ensure_ascii=ensure_ascii)

def read_css_to_json_object(css_file_path: str) -> Dict[str, Any]:
    """读取CSS文件并返回Python字典对象"""
    json_str = read_css_to_json(css_file_path, indent=0)
    return json.loads(json_str)
import argparse
from utils import read_css_to_json

# ------------------------------
# 使用示例
# ------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "css_dir",
        type=str,
        help="Input css file.",
    )

    parser.add_argument(
        "--output_dir",
        type=str,
        default="",
        help=(
            "Enter path to directory to save output. "
            "Defaults to the current working directory."
        )
    )

    args = parser.parse_args()
    css_path = args.css_dir

    try:
        json_result = read_css_to_json(css_path)
        print("CSS转换后的JSON：")
        print(json_result)
        
        # 保存JSON到文件
        with open("output.json", 'w', encoding='utf-8') as f:
            f.write(json_result)
        print(f"\nJSON已保存到 output.json")
        
    except Exception as e:
        print(f"错误：{str(e)}")
    
    # 示例2：获取Python字典对象
    # try:
    #     json_obj = read_css_to_json_object(css_path)
    #     print(f"\n规则数量：{json_obj['rule_count']}")
    #     print(f"第一个规则的选择器：{json_obj['rules'][0]['selectors']}")
    # except Exception as e:
    #     print(f"错误：{str(e)}")